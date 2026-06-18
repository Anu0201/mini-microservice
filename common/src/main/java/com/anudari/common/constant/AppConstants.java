package com.anudari.common.constant;

public final class AppConstants {

    private AppConstants() {}

    public interface HEADER {
        String AUTH_USERNAME   = "X-Auth-Username";
        String AUTH_USER_ID    = "X-Auth-UserId";
        String AUTH_IS_ADMIN   = "X-Auth-IsAdmin";
        String INTERNAL_SECRET = "X-Internal-Secret";
        String REQUEST_ID      = "X-Request-Id";
        String IDEMPOTENCY_KEY = "Idempotency-Key";
    }

    public interface ROLE {
        String USER  = "ROLE_USER";
        String ADMIN = "ROLE_ADMIN";
    }

    public interface EVENT {
        String LOGIN_SUCCESS  = "LOGIN_SUCCESS";
        String LOGIN_FAIL     = "LOGIN_FAIL";
        String LOGOUT         = "LOGOUT";
        String TOKEN_REFRESH  = "TOKEN_REFRESH";
    }

    public interface INVOICE_STATUS {
        String UNPAID    = "UNPAID";
        String PAID      = "PAID";
        String CANCELLED = "CANCELLED";
    }
}