package com.anudari.payment_service.handler;

import com.anudari.common.exception.BusinessException;
import com.anudari.common.exception.RestrictionException;
import com.anudari.common.exception.RestSessionException;
import com.anudari.common.exception.RunTimeException;
import com.anudari.common.exception.SessionException;
import com.anudari.common.exception.TokenException;
import com.anudari.common.exception.ValidationException;
import com.anudari.common.utility.LogUtility;
import com.anudari.payment_service.util.MessageUtility;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String CLASS_NAME = GlobalExceptionHandler.class.getName();

    @ExceptionHandler({BusinessException.class, ValidationException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest2(RuntimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "BAD_REQUEST", "[bad.request] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler({TokenException.class, SessionException.class, RestSessionException.class})
    public ResponseEntity<Map<String, Object>> handleUnauthorized(RuntimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.warn(requestId, CLASS_NAME, "EXCEPTION", "UNAUTHORIZED", "[unauthorized] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(errorBody(HttpStatus.UNAUTHORIZED, ex.getMessage()));
    }

    @ExceptionHandler(RestrictionException.class)
    public ResponseEntity<Map<String, Object>> handleRestriction(RestrictionException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.warn(requestId, CLASS_NAME, "EXCEPTION", "FORBIDDEN", "[restriction] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    @ExceptionHandler(RunTimeException.class)
    public ResponseEntity<Map<String, Object>> handleRunTime(RunTimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.error(requestId, CLASS_NAME, "EXCEPTION", "RUNTIME_ERROR", "[runtime] " + ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, MessageUtility.getMessage("error.internal")));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "NOT_FOUND", "[not.found] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(errorBody(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(SecurityException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.warn(requestId, CLASS_NAME, "EXCEPTION", "FORBIDDEN", "[forbidden] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody(HttpStatus.FORBIDDEN, MessageUtility.getMessage("access.denied")));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "BAD_REQUEST", "[bad.request] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "CONFLICT", "[conflict] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errorBody(HttpStatus.CONFLICT, ex.getMessage()));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> handleMissingHeader(MissingRequestHeaderException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "BAD_REQUEST", "[missing.header] " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        String requestId = getRequestId(request);
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .toList();
        String message = String.join(", ", errors);

        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "VALIDATION", "[validation] " + message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.error(requestId, CLASS_NAME, "EXCEPTION", "INTERNAL_ERROR",
                "[unhandled] " + ex.getClass().getName() + ": " + ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, MessageUtility.getMessage("error.internal")));
    }

    private String getRequestId(WebRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        return requestId == null || requestId.isBlank() ? "N/A" : requestId;
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        return Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "timestamp", LocalDateTime.now().toString());
    }
}