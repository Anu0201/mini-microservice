package com.anudari.auth_service.dto;

import com.anudari.auth_service.entity.AuthHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthHistoryResponse {
    private Long id;
    private Long userId;
    private String username;
    private String eventType;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    public static AuthHistoryResponse from(AuthHistory h) {
        return AuthHistoryResponse.builder()
                .id(h.getId())
                .userId(h.getUserId())
                .username(h.getUsername())
                .eventType(h.getEventType())
                .ipAddress(h.getIpAddress())
                .userAgent(h.getUserAgent())
                .createdAt(h.getCreatedAt())
                .build();
    }
}