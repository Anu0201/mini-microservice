package com.anudari.auth_service.dto;

import java.util.List;

public record AuthResponse(String token, String username, List<String> roles) {}