package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import com.anudari.gateway_service.constants.LogCategory;
import com.anudari.gateway_service.utility.LogUtility;
import org.reactivestreams.Publisher;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR;
import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR;

@Component
public class GatewayLoggingFilter implements GlobalFilter, Ordered {

    public static final String REQUEST_ID_HEADER = AppConstants.HEADER.REQUEST_ID;

    @Override
    public int getOrder() {
        // Run before route-specific filters so every request, including rejected ones, is logged.
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = getRequestId(exchange);
        long startTime = System.currentTimeMillis();
        ByteArrayOutputStream responseBody = new ByteArrayOutputStream();

        // Propagate one correlation ID downstream and return the same ID to the client.
        ServerWebExchange tracedExchange = exchange.mutate()
                .request(exchange.getRequest().mutate()
                        .headers(headers -> headers.set(REQUEST_ID_HEADER, requestId))
                        .build())
                .response(captureResponse(exchange, responseBody))
                .build();

        tracedExchange.getResponse().getHeaders().set(REQUEST_ID_HEADER, requestId);

        return readBody(tracedExchange.getRequest())
                .flatMap(requestBody -> {
                    logRequest(tracedExchange, requestBody, requestId);

                    // A reactive request body can only be consumed once. Replay the buffered bytes
                    // so AuthFilter and the downstream service can still read the original body.
                    ServerWebExchange replayableExchange = tracedExchange.mutate()
                            .request(replayRequest(tracedExchange, requestBody))
                            .build();

                    return chain.filter(replayableExchange)
                            .doOnError(error -> logError(replayableExchange, error, requestId))
                            .doFinally(signal -> logResponse(
                                    replayableExchange,
                                    responseBody.toByteArray(),
                                    requestId,
                                    System.currentTimeMillis() - startTime,
                                    signal.name()));
                });
    }

    private String getRequestId(ServerWebExchange exchange) {
        String requestId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);
        return requestId == null || requestId.isBlank()
                ? UUID.randomUUID().toString()
                : requestId;
    }

    private Mono<byte[]> readBody(ServerHttpRequest request) {
        // Join all incoming chunks into one byte array for logging and replay.
        return DataBufferUtils.join(request.getBody())
                .map(buffer -> {
                    byte[] body = new byte[buffer.readableByteCount()];
                    buffer.read(body);
                    DataBufferUtils.release(buffer);
                    return body;
                })
                .defaultIfEmpty(new byte[0]);
    }

    private ServerHttpRequest replayRequest(ServerWebExchange exchange, byte[] body) {
        return new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            public HttpHeaders getHeaders() {
                // The replayed body is a single known-size buffer, so update its transport headers.
                HttpHeaders headers = new HttpHeaders();
                headers.putAll(super.getHeaders());
                headers.remove(HttpHeaders.TRANSFER_ENCODING);
                headers.setContentLength(body.length);
                return headers;
            }

            @Override
            public Flux<DataBuffer> getBody() {
                return body.length == 0
                        ? Flux.empty()
                        : Flux.just(exchange.getResponse().bufferFactory().wrap(body));
            }
        };
    }

    private ServerHttpResponseDecorator captureResponse(
            ServerWebExchange exchange,
            ByteArrayOutputStream capturedBody
    ) {
        return new ServerHttpResponseDecorator(exchange.getResponse()) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                // Copy each response chunk for logging while forwarding the same buffer unchanged.
                return super.writeWith(Flux.from(body)
                        .doOnNext(buffer -> copy(buffer, capturedBody)));
            }

            @Override
            public Mono<Void> writeAndFlushWith(
                    Publisher<? extends Publisher<? extends DataBuffer>> body
            ) {
                // Streaming responses use nested publishers, so capture their inner chunks too.
                return super.writeAndFlushWith(Flux.from(body)
                        .map(chunks -> Flux.from(chunks)
                                .doOnNext(buffer -> copy(buffer, capturedBody))));
            }
        };
    }

    private void copy(DataBuffer buffer, ByteArrayOutputStream target) {
        // Read through a view of the buffer so its reader index is not changed.
        ByteBuffer bytes = buffer.toByteBuffer().asReadOnlyBuffer();
        byte[] chunk = new byte[bytes.remaining()];
        bytes.get(chunk);
        target.writeBytes(chunk);
    }

    private void logRequest(ServerWebExchange exchange, byte[] body, String requestId) {
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        ServerHttpRequest request = exchange.getRequest();

        String message = "[direction=client->gateway->service]"
                + "[method=" + request.getMethod() + "]"
                + "[uri=" + request.getURI() + "]"
                + "[remoteAddress=" + request.getRemoteAddress() + "]"
                + routeDetails(route)
                + "[headers=" + request.getHeaders() + "]"
                + "[body=" + formatBody(body, request.getHeaders().getContentType()) + "]";

        logInfo(requestId, LogCategory.REQUEST, "gateway.request.in", message);
    }

    private void logResponse(
            ServerWebExchange exchange,
            byte[] body,
            String requestId,
            long durationMs,
            String signal
    ) {
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        Object source = exchange.getAttribute(GATEWAY_REQUEST_URL_ATTR);

        String message = "[direction=service->gateway->client]"
                + routeDetails(route)
                + "[source=" + source + "]"
                + "[status=" + exchange.getResponse().getStatusCode() + "]"
                + "[signal=" + signal + "]"
                + "[durationMs=" + durationMs + "]"
                + "[headers=" + exchange.getResponse().getHeaders() + "]"
                + "[body=" + formatBody(
                        body, exchange.getResponse().getHeaders().getContentType()) + "]";

        logInfo(requestId, LogCategory.RESPONSE, "gateway.response.out", message);
    }

    private void logError(ServerWebExchange exchange, Throwable error, String requestId) {
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        String message = "[method=" + exchange.getRequest().getMethod() + "]"
                + "[uri=" + exchange.getRequest().getURI() + "]"
                + routeDetails(route)
                + "[exception=" + error.getClass().getName() + "]"
                + "[message=" + error.getMessage() + "]";

        LogUtility.withRequestId(requestId,
                () -> LogUtility.error(
                        LogCategory.ERROR, "gateway.error", message, error));
    }

    private String routeDetails(Route route) {
        return "[routeId=" + (route == null ? "unmatched" : route.getId()) + "]"
                + "[destination=" + (route == null ? null : route.getUri()) + "]";
    }

    private void logInfo(
            String requestId,
            LogCategory category,
            String tag,
            String message
    ) {
        // Reactor may switch threads; scope ThreadContext only around the actual log statement.
        LogUtility.withRequestId(requestId,
                () -> LogUtility.info(category, tag, message));
    }

    static String formatBody(byte[] body, MediaType contentType) {
        if (body.length == 0) {
            return "<empty>";
        }

        // Keep human-readable payloads readable; encode binary data safely as text.
        if (isText(contentType)) {
            Charset charset = contentType != null && contentType.getCharset() != null
                    ? contentType.getCharset()
                    : StandardCharsets.UTF_8;
            return new String(body, charset);
        }

        return "base64:" + Base64.getEncoder().encodeToString(body);
    }

    private static boolean isText(MediaType contentType) {
        if (contentType == null) {
            return true;
        }

        String subtype = contentType.getSubtype().toLowerCase();
        return "text".equals(contentType.getType())
                || subtype.contains("json")
                || subtype.contains("xml")
                || subtype.contains("javascript")
                || subtype.contains("form-urlencoded")
                || subtype.contains("graphql");
    }
}
