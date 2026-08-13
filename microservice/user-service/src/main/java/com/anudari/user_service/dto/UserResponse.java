package com.anudari.user_service.dto;

import com.anudari.common.utility.StringUtility;
import com.anudari.user_service.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(Long userId, String firstName, String lastName, String email, String phoneNumber, Set<String> roles, LocalDateTime createdDate, String initials, boolean hasPinSet, String profileImageUrl) {

    public static UserResponse from(User user) {
        String fullName = trim(user.getFirstName()) + " " + trim(user.getLastName());
        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRoles(),
                user.getCreatedDate(),
                StringUtility.initials(fullName.isBlank() ? user.getPhoneNumber() : fullName),
                user.getPinHash() != null,
                user.getProfileImageUrl()
        );
    }

    private static String trim(String s) {
        return s != null ? s.trim() : "";
    }
}