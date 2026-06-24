package com.anudari.user_service.dto;

import com.anudari.user_service.entity.User;

import java.util.List;

public record UserInternalResponse(Long id, String username, String credentialHash, List<String> roles) {

    public static UserInternalResponse from(User user) {
        return new UserInternalResponse(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                List.copyOf(user.getRoles())
        );
    }
}