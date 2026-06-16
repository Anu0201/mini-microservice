package com.anudari.auth_service.service;

import com.anudari.auth_service.dto.AuthHistoryResponse;
import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;

import java.util.List;

public interface AuthService {

    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);

    AuthResponse refresh(String bearerToken, String ipAddress, String userAgent);

    void logout(Long userId, String username, String ipAddress, String userAgent);

    List<AuthHistoryResponse> getUserHistory(Long userId);

    List<AuthHistoryResponse> getAllHistory();
}
