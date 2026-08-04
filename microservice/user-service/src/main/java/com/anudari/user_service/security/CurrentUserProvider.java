package com.anudari.user_service.security;

import com.anudari.common.constant.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final HttpServletRequest request;

    public Long getCurrentUserId() {
        String userId = request.getHeader(AppConstants.HEADER.AUTH_USER_ID);
        if (userId == null || userId.isBlank()) {
            throw new SecurityException("Unauthenticated");
        }
        return Long.parseLong(userId);
    }
}
