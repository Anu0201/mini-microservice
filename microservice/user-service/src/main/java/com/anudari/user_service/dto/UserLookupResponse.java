package com.anudari.user_service.dto;

import com.anudari.common.utility.StringUtility;
import com.anudari.user_service.entity.User;

public record UserLookupResponse(String phoneNumber, String maskedName, String initials, String profileImageUrl) {
    public static UserLookupResponse from(User user) {
        String fullName = trim(user.getFirstName()) + " " + trim(user.getLastName());
        return new UserLookupResponse(
                user.getPhoneNumber(),
                StringUtility.maskFullName(user.getFirstName(), user.getLastName()),
                StringUtility.initials(fullName.isBlank() ? user.getPhoneNumber() : fullName),
                user.getProfileImageUrl()
        );
    }

    private static String trim(String s) {
        return s != null ? s.trim() : "";
    }
}