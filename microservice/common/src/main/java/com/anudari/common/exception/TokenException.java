package com.anudari.common.exception;

/**
 * Unchecked exception for invalid or expired JWT tokens.
 * HTTP 401 Unauthorized.
 * Use when a token cannot be parsed, is expired, or fails signature verification.
 */
public class TokenException extends RuntimeException {

    public TokenException(String message) {
        super(message);
    }
}
