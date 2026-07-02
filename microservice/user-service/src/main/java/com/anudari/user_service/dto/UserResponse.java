package com.anudari.user_service.dto;

import com.anudari.user_service.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(Long userId, String username, String email, Set<String> roles, LocalDateTime createdDate) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles(),
                user.getCreatedDate()
        );
    }
}