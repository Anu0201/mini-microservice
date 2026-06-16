package com.anudari.auth_service.controller;

import com.anudari.auth_service.dto.AuthHistoryResponse;
import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;
import com.anudari.auth_service.service.AuthService;
import com.anudari.common.constant.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        return ResponseEntity.ok(authService.login(loginRequest, request.getRemoteAddr(), request.getHeader("User-Agent")));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String bearerToken,
            HttpServletRequest request) {
        return ResponseEntity.ok(authService.refresh(bearerToken, request.getRemoteAddr(), request.getHeader("User-Agent")));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USERNAME, required = false) String username,
            HttpServletRequest request) {
        if (userId == null || username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.logout(userId, username, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history/user")
    public ResponseEntity<List<AuthHistoryResponse>> getUserHistory(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getUserHistory(userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AuthHistoryResponse>> getAllHistory(
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        if (!"true".equals(isAdmin)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(authService.getAllHistory());
    }
}