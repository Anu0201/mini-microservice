package com.anudari.gateway_service.filter;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class GatewayLoggingFilterTests {

    private final GatewayLoggingFilter filter = new GatewayLoggingFilter();

    @Test
    void reusesRequestIdAndPreservesRequestAndResponseBodies() {
        String requestBody = "{\"name\":\"gateway\"}";
        String responseBody = "{\"status\":\"ok\"}";
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/test")
                        .header(GatewayLoggingFilter.REQUEST_ID_HEADER, "request-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody));
        AtomicReference<String> forwardedRequestId = new AtomicReference<>();
        AtomicReference<String> forwardedBody = new AtomicReference<>();

        filter.filter(exchange, filteredExchange ->
                captureRequest(filteredExchange.getRequest())
                        .flatMap(bytes -> {
                            forwardedRequestId.set(filteredExchange.getRequest()
                                    .getHeaders()
                                    .getFirst(GatewayLoggingFilter.REQUEST_ID_HEADER));
                            forwardedBody.set(new String(bytes, StandardCharsets.UTF_8));
                            filteredExchange.getResponse().getHeaders()
                                    .setContentType(MediaType.APPLICATION_JSON);
                            DataBuffer responseBuffer = filteredExchange.getResponse()
                                    .bufferFactory()
                                    .wrap(responseBody.getBytes(StandardCharsets.UTF_8));
                            return filteredExchange.getResponse()
                                    .writeWith(Mono.just(responseBuffer));
                        }))
                .block();

        assertThat(forwardedRequestId.get()).isEqualTo("request-123");
        assertThat(exchange.getResponse().getHeaders()
                .getFirst(GatewayLoggingFilter.REQUEST_ID_HEADER))
                .isEqualTo("request-123");
        assertThat(forwardedBody.get()).isEqualTo(requestBody);
        assertThat(exchange.getResponse().getBodyAsString().block())
                .isEqualTo(responseBody);
    }

    @Test
    void generatesRequestIdWhenHeaderIsMissing() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/test").build());
        AtomicReference<String> forwardedRequestId = new AtomicReference<>();

        filter.filter(exchange, filteredExchange -> {
                    forwardedRequestId.set(filteredExchange.getRequest()
                            .getHeaders()
                            .getFirst(GatewayLoggingFilter.REQUEST_ID_HEADER));
                    return filteredExchange.getResponse().setComplete();
                })
                .block();

        assertThat(forwardedRequestId.get()).isNotBlank();
        assertThat(exchange.getResponse().getHeaders()
                .getFirst(GatewayLoggingFilter.REQUEST_ID_HEADER))
                .isEqualTo(forwardedRequestId.get());
    }

    @Test
    void encodesBinaryBodiesAsBase64() {
        byte[] body = new byte[]{0, 1, 2, 3};

        assertThat(GatewayLoggingFilter.formatBody(
                body, MediaType.APPLICATION_OCTET_STREAM))
                .isEqualTo("base64:AAECAw==");
    }

    private Mono<byte[]> captureRequest(ServerHttpRequest request) {
        return DataBufferUtils.join(request.getBody())
                .map(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    DataBufferUtils.release(buffer);
                    return bytes;
                })
                .defaultIfEmpty(new byte[0]);
    }
}
