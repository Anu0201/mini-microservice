package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import com.anudari.gateway_service.utility.JwtUtility;
import io.jsonwebtoken.Claims;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(AuthFilter.class);

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
                log.debug("requestId={} open path, skipping auth: {}", finalRequestId, path);
                return chain.filter(exchange.mutate().request(builder.build()).build())
                        .doFinally(s -> exchange.getResponse().getHeaders()
                                .set(AppConstants.HEADER.REQUEST_ID, finalRequestId));
            }

            boolean hasToken = request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION);
            boolean isAdmin = !hasToken && isAdminOrigin(request);
            log.debug("requestId={} path={} hasToken={} isAdmin={}", finalRequestId, path, hasToken, isAdmin);

            if (hasToken) {
                Claims claims = jwtUtility.extractValidClaims(
                        request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
                if (claims == null) return onError(exchange);
                builder.header(AppConstants.HEADER.AUTH_USERNAME, claims.getSubject())
                       .header(AppConstants.HEADER.AUTH_USER_ID, String.valueOf(claims.get("userId")));
            } else if (isAdmin) {
                builder.header(AppConstants.HEADER.AUTH_IS_ADMIN, "true");
            } else {
                return onError(exchange);
            }

            return chain.filter(exchange.mutate().request(builder.build()).build())
                    .doFinally(s -> exchange.getResponse().getHeaders()
                            .set(AppConstants.HEADER.REQUEST_ID, finalRequestId));
        };
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

    private Mono<Void> onError(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}