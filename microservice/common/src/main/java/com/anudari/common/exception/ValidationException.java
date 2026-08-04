package com.anudari.common.exception;

/**
 * Unchecked exception for input validation failures.
 * HTTP 400 Bad Request.
 * Use when request data fails domain-level validation beyond Bean Validation
 * (e.g. invalid PIN format, missing required field combination).
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
