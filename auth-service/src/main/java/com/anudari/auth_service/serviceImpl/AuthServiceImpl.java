package com.anudari.auth_service.serviceImpl;

import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;
import com.anudari.auth_service.dto.UserInternalDto;
import com.anudari.auth_service.entity.AuthHistory;
import com.anudari.auth_service.constant.AppConstants;
import com.anudari.auth_service.exception.AuthenticationException;
import com.anudari.auth_service.feign.UserClient;
import com.anudari.auth_service.repository.AuthHistoryRepository;
import com.anudari.auth_service.security.JwtUtil;
import com.anudari.auth_service.service.*;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserClient userClient;
    private final AuthHistoryRepository authHistoryRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Override
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        UserInternalDto userDto;
        try {
            userDto = userClient.findByUsernameInternal(request.getUsername(), internalSecret);
        } catch (FeignException.NotFound e) {
            throw new AuthenticationException("Invalid credentials");
        }

        if (!passwordEncoder.matches(request.getPassword(), userDto.getCredentialHash())) {
            authHistoryRepository.save(AuthHistory.builder()
                    .userId(userDto.getId())
                    .username(request.getUsername())
                    .eventType(AppConstants.EVENT_LOGIN_FAIL)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build());
            throw new AuthenticationException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(userDto.getId(), userDto.getUsername(), userDto.getRoles());

        authHistoryRepository.save(AuthHistory.builder()
                .userId(userDto.getId())
                .username(userDto.getUsername())
                .eventType(AppConstants.EVENT_LOGIN_SUCCESS)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());

        return new AuthResponse(token, userDto.getUsername(), userDto.getRoles());
    }
}