package com.anudari.common.exception;

/**
 * Unchecked exception for missing or expired user sessions.
 * HTTP 401 Unauthorized.
 * Use when a required session (Redis, DB-backed) does not exist or has expired.
 */
public class SessionException extends RuntimeException {

    public SessionException(String message) {
        super(message);
    }
}
