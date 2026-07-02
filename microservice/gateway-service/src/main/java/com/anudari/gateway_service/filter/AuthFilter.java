package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import com.anudari.gateway_service.constants.LogCategory;
import com.anudari.gateway_service.utility.JwtUtility;
import com.anudari.gateway_service.utility.LogUtility;
import io.jsonwebtoken.Claims;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class AuthFilter extends AbstractGatewayFilterFactory<AuthFilter.Config> {

    private final JwtUtility jwtUtility;

    @Value("${security.allowlist.origins}")
    private List<String> allowedOrigins;

    public AuthFilter(JwtUtility jwtUtility) {
        super(Config.class);
        this.jwtUtility = jwtUtility;
    }

    @Getter
    @Setter
    public static class Config {
        private List<String> openPaths = new ArrayList<>();
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            ServerHttpRequest.Builder builder = stripAuthHeaders(request);

            String requestId = request.getHeaders().getFirst(AppConstants.HEADER.REQUEST_ID);
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }
            builder.header(AppConstants.HEADER.REQUEST_ID, requestId);
            final String finalRequestId = requestId;

            String method = request.getMethod().name();
            boolean isOpen = config.getOpenPaths().stream().anyMatch(entry -> {
                if (entry.contains(":")) {
                    String[] parts = entry.split(":", 2);
                    return parts[0].equalsIgnoreCase(method) && parts[1].equals(path);
                }
                return entry.equals(path);
            });

            if (isOpen) {
                logAuth(finalRequestId,
                        "[path=" + path + "][result=open-path]");
                return chain.filter(exchange.mutate().request(builder.build()).build())
                        .doFinally(s -> exchange.getResponse().getHeaders()
                                .set(AppConstants.HEADER.REQUEST_ID, finalRequestId));
            }

            boolean hasToken = request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION);
            boolean isAdmin = !hasToken && isAdminOrigin(request);
            logAuth(finalRequestId, "[path=" + path + "]"
                    + "[hasToken=" + hasToken + "]"
                    + "[isAdmin=" + isAdmin + "]");

            if (hasToken) {
                Claims claims = jwtUtility.extractValidClaims(
                        request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
                if (claims == null) {
                    logAuth(finalRequestId,
                            "[path=" + path + "][result=invalid-token]");
                    return onError(exchange, finalRequestId);
                }
                builder.header(AppConstants.HEADER.AUTH_USERNAME, claims.getSubject());
                Object userId = claims.get("userId");
                if (userId != null) {
                    builder.header(AppConstants.HEADER.AUTH_USER_ID, String.valueOf(userId));
                }
            } else if (isAdmin) {
                builder.header(AppConstants.HEADER.AUTH_IS_ADMIN, "true");
            } else {
                logAuth(finalRequestId,
                        "[path=" + path + "][result=unauthorized]");
                return onError(exchange, finalRequestId);
            }

            return chain.filter(exchange.mutate().request(builder.build()).build())
                    .doFinally(s -> exchange.getResponse().getHeaders()
                            .set(AppConstants.HEADER.REQUEST_ID, finalRequestId));
        };
    }

    private void logAuth(String requestId, String message) {
        LogUtility.withRequestId(requestId,
                () -> LogUtility.info(
                        LogCategory.AUTHENTICATION, "gateway.auth", message));
    }

    private boolean isAdminOrigin(ServerHttpRequest request) {
        InetSocketAddress addr = request.getRemoteAddress();
        if (addr == null) return false;
        String ip = addr.getAddress().getHostAddress();
        return allowedOrigins.stream().map(String::trim).anyMatch(ip::equals);
    }

    private ServerHttpRequest.Builder stripAuthHeaders(ServerHttpRequest request) {
        return request.mutate().headers(h -> {
            h.remove(AppConstants.HEADER.AUTH_USERNAME);
            h.remove(AppConstants.HEADER.AUTH_USER_ID);
            h.remove(AppConstants.HEADER.AUTH_IS_ADMIN);
        });
    }

    private Mono<Void> onError(ServerWebExchange exchange, String requestId) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders()
                .set(AppConstants.HEADER.REQUEST_ID, requestId);
        return exchange.getResponse().setComplete();
    }
}
