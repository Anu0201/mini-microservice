package com.anudari.gateway_service.handler;

import com.anudari.common.constant.AppConstants;
import com.anudari.common.utility.LogUtility;
import com.anudari.gateway_service.utility.MessageUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@Order(-1)
public class GlobalErrorHandler implements ErrorWebExceptionHandler {

    private static final String CLASS_NAME = GlobalErrorHandler.class.getName();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        String headerRequestId = exchange.getRequest().getHeaders().getFirst(AppConstants.HEADER.REQUEST_ID);
        String requestId = (headerRequestId != null && !headerRequestId.isBlank()) ? headerRequestId : "N/A";
        String path = exchange.getRequest().getURI().getPath();

        HttpStatus status = ex instanceof ResponseStatusException rse
                ? HttpStatus.valueOf(rse.getStatusCode().value())
                : HttpStatus.INTERNAL_SERVER_ERROR;

        String errorMessage = ex.getMessage() != null ? ex.getMessage() : MessageUtility.getMessage("error.internal");

        // LogUtility ашиглан алдааг тэмдэглэх
        if (status.is5xxServerError()) {
            LogUtility.error(requestId, CLASS_NAME, "GATEWAY_ERROR", status.name(), "[path=" + path + "] " + errorMessage, ex);
        } else {
            LogUtility.warn(requestId, CLASS_NAME, "GATEWAY_ERROR", status.name(), "[path=" + path + "] " + errorMessage);
        }

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        if (!"N/A".equals(requestId)) {
            exchange.getResponse().getHeaders().set(AppConstants.HEADER.REQUEST_ID, requestId);
        }

        Map<String, Object> body = Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", errorMessage,
                "timestamp", LocalDateTime.now().toString()
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            bytes = "{\"error\":\"Internal Server Error\"}".getBytes();
        }

        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}