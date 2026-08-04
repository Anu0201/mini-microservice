package com.anudari.common.exception;

/**
 * Unchecked exception for business rule violations.
 * HTTP 400 Bad Request.
 * Use when a request is structurally valid but violates a business constraint
 * (e.g. PIN already set, invoice already paid, self-transfer not allowed).
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
