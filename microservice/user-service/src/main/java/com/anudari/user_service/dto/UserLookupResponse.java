package com.anudari.user_service.dto;

import com.anudari.common.utility.StringUtility;
import com.anudari.user_service.entity.User;

public record UserLookupResponse(String phoneNumber, String username, String maskedName, String initials) {
    public static UserLookupResponse from(User user) {
        return new UserLookupResponse(
                user.getPhoneNumber(),
                user.getUsername(),
                StringUtility.maskName(user.getUsername()),
                StringUtility.initials(user.getUsername())
        );
    }
}