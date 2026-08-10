package com.anudari.common.utility;

import java.security.SecureRandom;

public final class StringUtility {

    private static final String MASK = "•••";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "abcdefghijklmnopqrstuvwxyz0123456789";

    private StringUtility() {
    }

    public static String maskName(String name) {
        if (name == null || name.length() <= 3) {
            return name == null ? "" : name;
        }
        return name.charAt(0) + String.valueOf(name.charAt(1)) + MASK + name.charAt(name.length() - 1);
    }

    public static String initials(String name) {
        if (name == null || name.isBlank()) {
            return "?";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return (String.valueOf(parts[0].charAt(0)) + parts[1].charAt(0)).toUpperCase();
        }
        int end = Math.min(2, parts[0].length());
        return parts[0].substring(0, end).toUpperCase();
    }

    public static String createIdempotencyKey(String prefix) {
        String p = (prefix == null || prefix.isBlank()) ? "request" : prefix;
        return p + "-" + System.currentTimeMillis() + "-" + randomAlphanumeric(8);
    }

    public static String createIdempotencyKey() {
        return createIdempotencyKey("request");
    }

    private static String randomAlphanumeric(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}