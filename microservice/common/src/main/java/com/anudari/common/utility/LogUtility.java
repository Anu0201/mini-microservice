package com.anudari.common.utility;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public final class LogUtility {

    private LogUtility() {
    }

    private static Logger getLogger(String className) {
        return LogManager.getLogger(className);
    }

    private static String buildMessage(String custCode, String entityType, String message) {
        return "[" + custCode + "]"
                + "[" + entityType + "]"
                + message;
    }

    private static String buildMessage(String correlationId, String custCode, String entityType, String message) {
        return "[" + correlationId + "]"
                + "[" + custCode + "]"
                + "[" + entityType + "]"
                + message;
    }

    public static void info(String className, String custCode, String entityType, String message) {
        getLogger(className).info(buildMessage(custCode, entityType, message));
    }

    public static void info(String correlationId, String className, String custCode, String entityType, String message) {
        getLogger(className).info(buildMessage(correlationId, custCode, entityType, message));
    }

    public static void warn(String className, String custCode, String entityType, String message) {
        getLogger(className).warn(buildMessage(custCode, entityType, message));
    }

    public static void warn(String correlationId, String className, String custCode, String entityType, String message) {
        getLogger(className).warn(buildMessage(correlationId, custCode, entityType, message));
    }

    public static void debug(String className, String custCode, String entityType, String message) {
        getLogger(className).debug(buildMessage(custCode, entityType, message));
    }

    public static void debug(String correlationId, String className, String custCode, String entityType, String message) {
        getLogger(className).debug(buildMessage(correlationId, custCode, entityType, message));
    }

    public static void error(String className, String custCode, String entityType, String message) {
        getLogger(className).error(buildMessage(custCode, entityType, message));
    }

    public static void error(String className, String custCode, String entityType, String message, Throwable ex) {
        getLogger(className).error(buildMessage(custCode, entityType, message), ex);
    }

    public static void error(String correlationId, String className, String custCode, String entityType, String message) {
        getLogger(className).error(buildMessage(correlationId, custCode, entityType, message));
    }

    public static void error(String correlationId, String className, String custCode, String entityType, String message, Throwable ex) {
        getLogger(className).error(buildMessage(correlationId, custCode, entityType, message), ex);
    }
}
