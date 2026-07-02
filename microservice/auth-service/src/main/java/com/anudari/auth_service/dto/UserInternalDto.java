package com.anudari.auth_service.dto;

import java.util.List;

public record UserInternalDto(Long userId, String username, String credentialHash, List<String> roles) {}