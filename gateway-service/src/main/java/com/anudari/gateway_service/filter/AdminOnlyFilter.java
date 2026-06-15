package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.List;

@Component
public class AdminOnlyFilter extends AbstractGatewayFilterFactory<AdminOnlyFilter.Config> {

    @Value("${security.allowlist.origins}")
    private List<String> allowedOrigins;

    public AdminOnlyFilter() {
        super(Config.class);
    }

    public static class Config {
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Spoofing-аас хамгаалж auth header-уудыг устгана
            ServerHttpRequest stripped = request.mutate()
                    .headers(headers -> {
                        headers.remove(AppConstants.HEADER.AUTH_USERNAME);
                        headers.remove(AppConstants.HEADER.AUTH_USER_ID);
                    })
                    .build();

            InetSocketAddress remoteAddress = request.getRemoteAddress();
            String clientIp = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "";

            boolean isAdminOrigin = allowedOrigins.stream()
                    .map(String::trim)
                    .anyMatch(clientIp::equals);

            if (!isAdminOrigin) {
                return onError(exchange, HttpStatus.FORBIDDEN);
            }

            return chain.filter(exchange.mutate().request(stripped).build());
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        return response.setComplete();
    }
}