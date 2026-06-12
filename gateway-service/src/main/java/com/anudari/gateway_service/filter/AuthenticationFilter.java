package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import com.anudari.gateway_service.utility.JwtUtility;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.function.Predicate;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final JwtUtility jwtUtility;

    @Value("${security.allowlist.origins}")
    private List<String> allowedOrigins;

    public AuthenticationFilter(JwtUtility jwtUtility) {
        super(Config.class);
        this.jwtUtility = jwtUtility;
    }

    public static class Config {
    }

    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/auth/login",
            "/api/users/register"
    );

    private final Predicate<ServerHttpRequest> isSecured = request ->
            OPEN_ENDPOINTS.stream().noneMatch(uri -> request.getURI().getPath().equals(uri));

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            ServerHttpRequest.Builder requestBuilder = request.mutate()
                    .headers(headers -> {
                        headers.remove(AppConstants.HEADER.AUTH_USERNAME);
                        headers.remove(AppConstants.HEADER.AUTH_USER_ID);
                    });

            InetSocketAddress remoteAddress = request.getRemoteAddress();
            String clientIp = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "null";
            log.debug("Request from IP: {}, path: {}", clientIp, request.getURI().getPath());

            boolean isAdminOrigin = remoteAddress != null &&
                    allowedOrigins.stream()
                            .map(String::trim)
                            .anyMatch(clientIp::equals);

            boolean hasToken = request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION);

            if (hasToken && isSecured.test(request)) {
                // JWT-тэй request - user route: шалгаж header нэмнэ
                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    return onError(exchange, HttpStatus.UNAUTHORIZED);
                }
                String token = authHeader.substring(7);
                if (jwtUtility.isInvalid(token)) {
                    return onError(exchange, HttpStatus.UNAUTHORIZED);
                }
                try {
                    Claims claims = jwtUtility.extractClaims(token);
                    requestBuilder
                            .header(AppConstants.HEADER.AUTH_USERNAME, claims.getSubject())
                            .header(AppConstants.HEADER.AUTH_USER_ID, String.valueOf(claims.get("userId")));
                } catch (Exception e) {
                    return onError(exchange, HttpStatus.UNAUTHORIZED);
                }
            } else if (!hasToken && !isAdminOrigin && isSecured.test(request)) {
                // Token байхгүй + admin origin биш = 401 zaana
                return onError(exchange, HttpStatus.UNAUTHORIZED);
            }
            // Token байхгүй + admin origin = шууд дамжуулна

            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }
}