package com.anudari.auth_service.handler;

import com.anudari.common.constant.AppConstants;
import com.anudari.common.exception.BusinessException;
import com.anudari.common.exception.RestrictionException;
import com.anudari.common.exception.RestSessionException;
import com.anudari.common.exception.RunTimeException;
import com.anudari.common.exception.SessionException;
import com.anudari.common.exception.TokenException;
import com.anudari.common.exception.ValidationException;
import com.anudari.common.utility.LogUtility;
import com.anudari.auth_service.util.MessageUtility;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String CLASS_NAME = GlobalExceptionHandler.class.getName();

    @ExceptionHandler({TokenException.class, SessionException.class, RestSessionException.class})
    public ResponseEntity<Map<String, Object>> handleUnauthorized(RuntimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        String message = ex.getMessage() != null ? ex.getMessage() : MessageUtility.getMessage("auth.unauthorized");
        LogUtility.warn(requestId, CLASS_NAME, "EXCEPTION", "UNAUTHORIZED", "[unauthorized] " + message);
        return buildResponse(HttpStatus.UNAUTHORIZED, message);
    }

    @ExceptionHandler({BusinessException.class, ValidationException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "BAD_REQUEST", "[bad.request] " + ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(RestrictionException.class)
    public ResponseEntity<Map<String, Object>> handleRestriction(RestrictionException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.warn(requestId, CLASS_NAME, "EXCEPTION", "FORBIDDEN", "[restriction] " + ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(RunTimeException.class)
    public ResponseEntity<Map<String, Object>> handleRunTime(RunTimeException ex, WebRequest request) {
        String requestId = getRequestId(request);
        LogUtility.error(requestId, CLASS_NAME, "EXCEPTION", "RUNTIME_ERROR", "[runtime] " + ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, MessageUtility.getMessage("error.internal"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        String requestId = getRequestId(request);

        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .toList();

        String message = errors.isEmpty()
                ? MessageUtility.getMessage("validation.failed")
                : String.join(", ", errors);

        LogUtility.info(requestId, CLASS_NAME, "EXCEPTION", "VALIDATION", "[validation] " + message);

        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, WebRequest request) {
        String requestId = getRequestId(request);
        String message = MessageUtility.getMessage("error.internal");

        LogUtility.error(requestId, CLASS_NAME, "EXCEPTION", "INTERNAL_ERROR",
                "[unhandled] " + ex.getClass().getName() + ": " + ex.getMessage(), ex);

        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    private String getRequestId(WebRequest request) {
        String requestId = request.getHeader(AppConstants.HEADER.REQUEST_ID);
        return (requestId == null || requestId.isBlank()) ? "N/A" : requestId;
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.status(status).body(body);
    }
}