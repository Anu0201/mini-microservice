package com.anudari.auth_service.dto;

import com.anudari.auth_service.entity.AuthHistory;
import lombok.Value;

import java.time.LocalDateTime;

@Value
public class AuthHistoryResponse {
    Long id;
    Long userId;
    String username;
    String eventType;
    String ipAddress;
    String userAgent;
    LocalDateTime createdAt;

    public static AuthHistoryResponse from(AuthHistory h) {
        return new AuthHistoryResponse(
                h.getId(), h.getUserId(), h.getUsername(),
                h.getEventType(), h.getIpAddress(), h.getUserAgent(), h.getCreatedAt());
    }
}