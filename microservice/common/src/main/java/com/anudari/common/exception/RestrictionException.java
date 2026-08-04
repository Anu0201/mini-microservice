package com.anudari.common.exception;

/**
 * Unchecked exception for access restriction / forbidden operations.
 * HTTP 403 Forbidden.
 * Use when the caller is authenticated but not authorized to perform the action
 * (e.g. user accessing another user's resource, non-admin calling admin endpoint).
 */
public class RestrictionException extends RuntimeException {

    public RestrictionException(String message) {
        super(message);
    }
}
