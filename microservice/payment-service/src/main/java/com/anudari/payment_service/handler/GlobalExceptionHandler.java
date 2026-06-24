package com.anudari.payment_service.handler;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.NoSuchElementException;

import static org.springframework.http.HttpStatus.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler
    public ResponseEntity<Map<String, Object>> handle(Exception ex) {
        return switch (ex) {
            case NoSuchElementException e          -> ResponseEntity.status(NOT_FOUND).body(errorBody(NOT_FOUND, e.getMessage()));
            case SecurityException e               -> ResponseEntity.status(FORBIDDEN).body(errorBody(FORBIDDEN, "Access denied"));
            case IllegalStateException e           -> ResponseEntity.status(CONFLICT).body(errorBody(CONFLICT, e.getMessage()));
            case MethodArgumentNotValidException e -> ResponseEntity.status(BAD_REQUEST).body(errorBody(BAD_REQUEST, firstError(e)));
            default                                -> ResponseEntity.status(INTERNAL_SERVER_ERROR).body(errorBody(INTERNAL_SERVER_ERROR, "Internal server error"));
        };
    }

    private String firstError(MethodArgumentNotValidException e) {
        return e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .findFirst().orElse("Validation failed");
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        return Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        );
    }
}