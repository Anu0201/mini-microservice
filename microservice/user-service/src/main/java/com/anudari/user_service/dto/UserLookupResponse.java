package com.anudari.user_service.dto;

import com.anudari.user_service.entity.User;

public record UserLookupResponse(String phoneNumber, String username) {
    public static UserLookupResponse from(User user) {
        return new UserLookupResponse(user.getPhoneNumber(), user.getUsername());
    }
}