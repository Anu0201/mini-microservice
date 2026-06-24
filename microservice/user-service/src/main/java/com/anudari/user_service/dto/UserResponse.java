package com.anudari.user_service.dto;

import com.anudari.user_service.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(Long id, String username, String email, Set<String> roles, LocalDateTime createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles(),
                user.getCreatedAt()
        );
    }
}