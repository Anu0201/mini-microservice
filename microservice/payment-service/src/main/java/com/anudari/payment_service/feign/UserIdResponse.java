package com.anudari.payment_service.feign;

import java.util.List;

public record UserIdResponse(Long userId, String username, String firstName, String lastName, String credentialHash, List<String> roles) {
    public String fullName() {
        String f = firstName != null ? firstName.trim() : "";
        String l = lastName != null ? lastName.trim() : "";
        String full = (l + " " + f).trim();
        return full.isBlank() ? username : full;
    }
}
