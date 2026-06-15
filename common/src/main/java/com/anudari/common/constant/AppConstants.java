package com.anudari.common.constant;

public final class AppConstants {

    private AppConstants() {}

    public interface HEADER {
        String AUTH_USERNAME   = "X-Auth-Username";
        String AUTH_USER_ID    = "X-Auth-UserId";
        String AUTH_IS_ADMIN   = "X-Auth-IsAdmin";
        String INTERNAL_SECRET = "X-Internal-Secret";
    }

    public interface ROLE {
        String USER = "ROLE_USER";
    }

    public interface EVENT {
        String LOGIN_SUCCESS = "LOGIN_SUCCESS";
        String LOGIN_FAIL    = "LOGIN_FAIL";
    }

    public interface INVOICE_STATUS {
        String UNPAID    = "UNPAID";
        String PAID      = "PAID";
        String CANCELLED = "CANCELLED";
    }
}