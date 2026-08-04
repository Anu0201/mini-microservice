package com.anudari.common.exception;

/**
 * Unchecked exception for unexpected application-level runtime errors.
 * HTTP 500 Internal Server Error.
 * Use for errors that indicate a programming fault or unrecoverable state
 * that should not be exposed to the client.
 */
public class RunTimeException extends RuntimeException {

    public RunTimeException(String message) {
        super(message);
    }

    public RunTimeException(String message, Throwable cause) {
        super(message, cause);
    }
}
