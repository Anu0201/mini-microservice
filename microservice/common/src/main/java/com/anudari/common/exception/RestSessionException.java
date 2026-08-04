package com.anudari.common.exception;

/**
 * Unchecked exception for authentication failures in inter-service REST calls.
 * HTTP 401 Unauthorized.
 * Use in Feign clients or interceptors when a downstream service returns 401,
 * indicating the internal secret or service credential is invalid.
 */
public class RestSessionException extends RuntimeException {

    public RestSessionException(String message) {
        super(message);
    }
}
