package com.anudari.auth_service.controller;

import com.anudari.auth_service.dto.LoginRequest;
import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {

        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        AuthResponse response = authService.login(loginRequest, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }
}