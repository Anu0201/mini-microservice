package com.anudari.gateway_service.utility;

import com.anudari.gateway_service.constants.LogCategory;
import org.apache.logging.log4j.CloseableThreadContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.ThreadContext;

public final class LogUtility {

    private static final String REQUEST_ID_KEY = "requestId";

    private LogUtility() {
    }

    private static StackTraceElement getCaller() {
        return StackWalker.getInstance()
                .walk(frames -> frames
                        .filter(frame -> !frame.getClassName().equals(LogUtility.class.getName()))
                        .findFirst()
                        .map(StackWalker.StackFrame::toStackTraceElement)
                        .orElseGet(() -> new StackTraceElement(
                                LogUtility.class.getName(), "unknown", null, -1)));
    }

    private static Logger getLogger(StackTraceElement caller) {
        return LogManager.getLogger(caller.getClassName());
    }

    private static String buildMessage(
            StackTraceElement caller,
            String message,
            LogCategory category,
            String tag
    ) {
        String className = caller.getClassName();
        String simpleClass = className.substring(className.lastIndexOf('.') + 1);
        String requestId = ThreadContext.get(REQUEST_ID_KEY);

        if (requestId == null) {
            requestId = "N/A";
        }

        return "[" + simpleClass + "." + caller.getMethodName() + "]"
                + "[" + requestId + "]"
                + "[" + tag + "]"
                + "[" + category + "]"
                + message;
    }

    private static void logInfo(LogCategory category, String tag, String message) {
        StackTraceElement caller = getCaller();
        getLogger(caller).info(buildMessage(caller, message, category, tag));
    }

    private static void logWarn(LogCategory category, String tag, String message) {
        StackTraceElement caller = getCaller();
        getLogger(caller).warn(buildMessage(caller, message, category, tag));
    }

    private static void logError(
            LogCategory category,
            String tag,
            String message,
            Throwable throwable
    ) {
        StackTraceElement caller = getCaller();
        getLogger(caller).error(buildMessage(caller, message, category, tag), throwable);
    }

    public static void withRequestId(String requestId, Runnable action) {
        String value = requestId == null || requestId.isBlank() ? "N/A" : requestId;
        try (CloseableThreadContext.Instance ignored =
                     CloseableThreadContext.put(REQUEST_ID_KEY, value)) {
            action.run();
        }
    }

    public static void info(String message) {
        logInfo(null, null, message);
    }

    public static void warn(String message) {
        logWarn(null, null, message);
    }

    public static void error(String message) {
        logError(null, null, message, null);
    }

    public static void error(String message, Throwable throwable) {
        logError(null, null, message, throwable);
    }

    public static void info(LogCategory category, String message) {
        logInfo(category, null, message);
    }

    public static void warn(LogCategory category, String message) {
        logWarn(category, null, message);
    }

    public static void error(LogCategory category, String message) {
        logError(category, null, message, null);
    }

    public static void error(LogCategory category, String message, Throwable throwable) {
        logError(category, null, message, throwable);
    }

    public static void info(LogCategory category, String tag, String message) {
        logInfo(category, tag, message);
    }

    public static void warn(LogCategory category, String tag, String message) {
        logWarn(category, tag, message);
    }

    public static void error(LogCategory category, String tag, String message) {
        logError(category, tag, message, null);
    }

    public static void error(
            LogCategory category,
            String tag,
            String message,
            Throwable throwable
    ) {
        logError(category, tag, message, throwable);
    }
}
