package com.anudari.gateway_service.filter;

import com.anudari.common.constant.AppConstants;
import com.anudari.gateway_service.constants.LogCategory;
import com.anudari.gateway_service.utils.LogUtility;
import org.reactivestreams.Publisher;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR;
import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR;

@Component
public class GatewayLoggingFilter implements GlobalFilter, Ordered {

    public static final String REQUEST_ID_HEADER = AppConstants.HEADER.REQUEST_ID;

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = resolveRequestId(exchange.getRequest());
        long startedAt = System.nanoTime();
        CapturedBody responseBody = new CapturedBody();
        AtomicBoolean responseLogged = new AtomicBoolean();

        ServerHttpRequest requestWithId = exchange.getRequest().mutate()
                .headers(headers -> headers.set(REQUEST_ID_HEADER, requestId))
                .build();

        ServerHttpResponse decoratedResponse = decorateResponse(
                exchange.getResponse(), responseBody);
        decoratedResponse.getHeaders().set(REQUEST_ID_HEADER, requestId);

        ServerWebExchange exchangeWithTracing = exchange.mutate()
                .request(requestWithId)
                .response(decoratedResponse)
                .build();

        return readBody(requestWithId)
                .flatMap(requestBody -> {
                    logRequest(exchangeWithTracing, requestBody, requestId);
                    ServerHttpRequest replayableRequest =
                            decorateRequest(
                                    requestWithId,
                                    requestBody,
                                    decoratedResponse.bufferFactory());
                    ServerWebExchange replayableExchange = exchangeWithTracing.mutate()
                            .request(replayableRequest)
                            .build();

                    return chain.filter(replayableExchange)
                            .doOnError(throwable -> LogUtility.withRequestId(requestId,
                                    () -> LogUtility.error(
                                            LogCategory.ERROR,
                                            "gateway.error",
                                            buildErrorMessage(replayableExchange, throwable),
                                            throwable)))
                            .doFinally(signalType -> logResponseOnce(
                                    replayableExchange,
                                    responseBody.bytes(),
                                    requestId,
                                    startedAt,
                                    signalType,
                                    responseLogged));
                });
    }

    private String resolveRequestId(ServerHttpRequest request) {
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        return requestId == null || requestId.isBlank()
                ? UUID.randomUUID().toString()
                : requestId;
    }

    private Mono<byte[]> readBody(ServerHttpRequest request) {
        return DataBufferUtils.join(request.getBody())
                .map(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    DataBufferUtils.release(buffer);
                    return bytes;
                })
                .defaultIfEmpty(new byte[0]);
    }

    private ServerHttpRequest decorateRequest(
            ServerHttpRequest request,
            byte[] body,
            DataBufferFactory bufferFactory
    ) {
        return new ServerHttpRequestDecorator(request) {
            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.putAll(super.getHeaders());
                if (body.length > 0) {
                    headers.remove(HttpHeaders.TRANSFER_ENCODING);
                    headers.setContentLength(body.length);
                }
                return headers;
            }

            @Override
            public Flux<DataBuffer> getBody() {
                if (body.length == 0) {
                    return Flux.empty();
                }
                return Flux.defer(() -> Flux.just(
                        bufferFactory.wrap(body)));
            }
        };
    }

    private ServerHttpResponse decorateResponse(
            ServerHttpResponse response,
            CapturedBody capturedBody
    ) {
        return new ServerHttpResponseDecorator(response) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                return super.writeWith(Flux.from(body)
                        .doOnNext(capturedBody::append));
            }

            @Override
            public Mono<Void> writeAndFlushWith(
                    Publisher<? extends Publisher<? extends DataBuffer>> body
            ) {
                return super.writeAndFlushWith(Flux.from(body)
                        .map(publisher -> Flux.from(publisher)
                                .doOnNext(capturedBody::append)));
            }
        };
    }

    private void logRequest(
            ServerWebExchange exchange,
            byte[] body,
            String requestId
    ) {
        ServerHttpRequest request = exchange.getRequest();
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        String routeId = route == null ? "unmatched" : route.getId();
        URI destination = route == null ? null : route.getUri();
        InetSocketAddress remoteAddress = request.getRemoteAddress();

        String message = "[direction=client->gateway->service]"
                + "[method=" + request.getMethod() + "]"
                + "[uri=" + request.getURI() + "]"
                + "[remoteAddress=" + remoteAddress + "]"
                + "[routeId=" + routeId + "]"
                + "[destination=" + destination + "]"
                + "[headers=" + request.getHeaders() + "]"
                + "[body=" + formatBody(body, request.getHeaders().getContentType()) + "]";

        LogUtility.withRequestId(requestId,
                () -> LogUtility.info(
                        LogCategory.REQUEST, "gateway.request.in", message));
    }

    private void logResponseOnce(
            ServerWebExchange exchange,
            byte[] body,
            String requestId,
            long startedAt,
            SignalType signalType,
            AtomicBoolean responseLogged
    ) {
        if (!responseLogged.compareAndSet(false, true)) {
            return;
        }

        ServerHttpResponse response = exchange.getResponse();
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        URI routedUrl = exchange.getAttribute(GATEWAY_REQUEST_URL_ATTR);
        String status = response.getStatusCode() == null
                ? signalType == SignalType.ON_ERROR
                    ? HttpStatus.INTERNAL_SERVER_ERROR.toString()
                    : HttpStatus.OK.toString()
                : response.getStatusCode().toString();
        long durationMillis = Duration.ofNanos(
                System.nanoTime() - startedAt).toMillis();

        String message = "[direction=service->gateway->client]"
                + "[routeId=" + (route == null ? "unmatched" : route.getId()) + "]"
                + "[source=" + (routedUrl == null
                ? route == null ? null : route.getUri()
                : routedUrl) + "]"
                + "[status=" + status + "]"
                + "[signal=" + signalType + "]"
                + "[durationMs=" + durationMillis + "]"
                + "[headers=" + response.getHeaders() + "]"
                + "[body=" + formatBody(
                        body, response.getHeaders().getContentType()) + "]";

        LogUtility.withRequestId(requestId,
                () -> LogUtility.info(
                        LogCategory.RESPONSE, "gateway.response.out", message));
    }

    private String buildErrorMessage(
            ServerWebExchange exchange,
            Throwable throwable
    ) {
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        return "[method=" + exchange.getRequest().getMethod() + "]"
                + "[uri=" + exchange.getRequest().getURI() + "]"
                + "[routeId=" + (route == null ? "unmatched" : route.getId()) + "]"
                + "[exception=" + throwable.getClass().getName() + "]"
                + "[message=" + throwable.getMessage() + "]";
    }

    static String formatBody(byte[] body, MediaType contentType) {
        if (body.length == 0) {
            return "<empty>";
        }

        if (isTextual(contentType)) {
            Charset charset = contentType == null || contentType.getCharset() == null
                    ? StandardCharsets.UTF_8
                    : contentType.getCharset();
            return new String(body, charset);
        }

        return "base64:" + Base64.getEncoder().encodeToString(body);
    }

    private static boolean isTextual(MediaType contentType) {
        if (contentType == null) {
            return true;
        }

        String subtype = contentType.getSubtype().toLowerCase();
        return "text".equals(contentType.getType())
                || subtype.contains("json")
                || subtype.contains("xml")
                || subtype.contains("javascript")
                || subtype.contains("x-www-form-urlencoded")
                || subtype.contains("graphql");
    }

    private static final class CapturedBody {
        private final ByteArrayOutputStream output = new ByteArrayOutputStream();

        synchronized void append(DataBuffer buffer) {
            ByteBuffer byteBuffer = buffer.toByteBuffer().asReadOnlyBuffer();
            byte[] bytes = new byte[byteBuffer.remaining()];
            byteBuffer.get(bytes);
            output.writeBytes(bytes);
        }

        synchronized byte[] bytes() {
            return output.toByteArray();
        }
    }
}
