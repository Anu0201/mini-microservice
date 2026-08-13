package com.anudari.user_service.dto;

import com.anudari.common.utility.StringUtility;
import com.anudari.user_service.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(Long userId, String username, String email, String phoneNumber, Set<String> roles, LocalDateTime createdDate, String initials, boolean hasPinSet, String profileImageUrl) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRoles(),
                user.getCreatedDate(),
                StringUtility.initials(user.getUsername()),
                user.getPinHash() != null,
                user.getProfileImageUrl()
        );
    }
}