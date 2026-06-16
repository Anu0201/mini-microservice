package com.anudari.auth_service.serviceImpl;

import com.anudari.auth_service.dto.AuthHistoryResponse;
import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;
import com.anudari.auth_service.dto.UserInternalDto;
import com.anudari.auth_service.entity.AuthHistory;
import com.anudari.auth_service.exception.AuthenticationException;
import com.anudari.auth_service.feign.UserClient;
import com.anudari.auth_service.repository.AuthHistoryRepository;
import com.anudari.auth_service.service.AuthService;
import com.anudari.auth_service.util.JwtUtil;
import com.anudari.common.constant.AppConstants;
import feign.FeignException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

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
                    .eventType(AppConstants.EVENT.LOGIN_FAIL)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build());
            throw new AuthenticationException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(userDto.getId(), userDto.getUsername(), userDto.getRoles());

        authHistoryRepository.save(AuthHistory.builder()
                .userId(userDto.getId())
                .username(userDto.getUsername())
                .eventType(AppConstants.EVENT.LOGIN_SUCCESS)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());

        return new AuthResponse(token, userDto.getUsername(), userDto.getRoles());
    }

    @Override
    public AuthResponse refresh(String bearerToken, String ipAddress, String userAgent) {
        Claims claims = jwtUtil.parseToken(bearerToken);
        if (claims == null) {
            throw new AuthenticationException("Invalid or expired token");
        }

        Long userId = ((Number) claims.get("userId")).longValue();
        String username = claims.getSubject();
        Object rawRoles = claims.get("roles");
        List<String> roles = rawRoles instanceof List<?> list
                ? list.stream().map(Object::toString).toList()
                : List.of();

        String newToken = jwtUtil.generateToken(userId, username, roles);

        authHistoryRepository.save(AuthHistory.builder()
                .userId(userId)
                .username(username)
                .eventType(AppConstants.EVENT.TOKEN_REFRESH)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());

        return new AuthResponse(newToken, username, roles);
    }

    @Override
    public void logout(Long userId, String username, String ipAddress, String userAgent) {
        authHistoryRepository.save(AuthHistory.builder()
                .userId(userId)
                .username(username)
                .eventType(AppConstants.EVENT.LOGOUT)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());
    }

    @Override
    public List<AuthHistoryResponse> getUserHistory(Long userId) {
        return authHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(AuthHistoryResponse::from)
                .toList();
    }

    @Override
    public List<AuthHistoryResponse> getAllHistory() {
        return authHistoryRepository.findAll().stream()
                .map(AuthHistoryResponse::from)
                .toList();
    }
}