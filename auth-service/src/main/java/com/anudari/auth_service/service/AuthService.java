package com.anudari.auth_service.service;

import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);
}
