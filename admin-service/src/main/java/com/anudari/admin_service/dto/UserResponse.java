package com.anudari.admin_service.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.Set;

@Value
public class UserResponse {
    Long id;
    String username;
    String email;
    Set<String> roles;
    LocalDateTime createdAt;
}