package com.anudari.auth_service.serviceImpl;

import com.anudari.auth_service.config.AppProperties;
import com.anudari.auth_service.dto.AuthHistoryResponse;
import com.anudari.auth_service.dto.AuthResponse;
import com.anudari.auth_service.dto.LoginRequest;
import com.anudari.auth_service.dto.UserInternalDto;
import com.anudari.auth_service.exception.AuthenticationException;
import com.anudari.auth_service.feign.UserClient;
import com.anudari.auth_service.repository.AuthHistoryRepository;
import com.anudari.auth_service.service.AsyncHistoryService;
import com.anudari.auth_service.service.AuthService;
import com.anudari.auth_service.util.JwtUtil;
import com.anudari.auth_service.util.MessageUtility;
import com.anudari.common.constant.AppConstants;
import com.anudari.common.utility.LogUtility;
import feign.FeignException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserClient userClient;
    private final AuthHistoryRepository authHistoryRepository;
    private final AsyncHistoryService asyncHistoryService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        LogUtility.info(this.getClass().getName(), request.phone(), "AUTH", "[login] attempt from ip: " + ipAddress + ", userAgent: " + userAgent);
        try {
            UserInternalDto userDto;
            try {
                userDto = userClient.findByPhoneInternal(request.phone(), appProperties.getInternalSecret());
            } catch (FeignException.NotFound e) {
                throw new AuthenticationException(MessageUtility.getMessage("invalid.credentials"));
            }

            if (!passwordEncoder.matches(request.password(), userDto.credentialHash())) {
                asyncHistoryService.save(userDto.userId(), userDto.username(),
                        AppConstants.EVENT.LOGIN_FAIL, ipAddress, userAgent);
                LogUtility.info(this.getClass().getName(), userDto.username(), "AUTH", "[login] failed - invalid password, ip: " + ipAddress);
                throw new AuthenticationException(MessageUtility.getMessage("invalid.credentials"));
            }

            String token = jwtUtil.generateToken(userDto.userId(), userDto.username(), userDto.roles());

            asyncHistoryService.save(userDto.userId(), userDto.username(),
                    AppConstants.EVENT.LOGIN_SUCCESS, ipAddress, userAgent);

            AuthResponse response = new AuthResponse(token, userDto.username(), userDto.roles());

            LogUtility.info(this.getClass().getName(), userDto.username(), "AUTH", "[login] success, username: " + userDto.username() + ", roles: " + userDto.roles());
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), request.phone(), "AUTH", "[login] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public AuthResponse refresh(String bearerToken, String ipAddress, String userAgent) {
        LogUtility.info(this.getClass().getName(), "N/A", "AUTH", "[refresh] attempt from ip: " + ipAddress + ", userAgent: " + userAgent);
        try {
            Claims claims = jwtUtil.parseToken(bearerToken);
            if (claims == null) {
                throw new AuthenticationException(MessageUtility.getMessage("invalid.or.expired.token"));
            }

            Long userId = ((Number) claims.get("userId")).longValue();
            String username = claims.getSubject();
            Object rawRoles = claims.get("roles");
            List<String> roles = rawRoles instanceof List<?> list
                    ? list.stream().map(Object::toString).toList()
                    : List.of();

            String newToken = jwtUtil.generateToken(userId, username, roles);

            asyncHistoryService.save(userId, username,
                    AppConstants.EVENT.TOKEN_REFRESH, ipAddress, userAgent);

            AuthResponse response = new AuthResponse(newToken, username, roles);

            LogUtility.info(this.getClass().getName(), username, "AUTH", "[refresh] success, username: " + username);
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), "N/A", "AUTH", "[refresh] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Async("asyncExecutor")
    @Override
    public void logout(Long userId, String username, String ipAddress, String userAgent) {
        LogUtility.info(this.getClass().getName(), username, "AUTH", "[logout] userId: " + userId + ", ip: " + ipAddress);
        try {
            asyncHistoryService.save(userId, username,
                    AppConstants.EVENT.LOGOUT, ipAddress, userAgent);

            LogUtility.info(this.getClass().getName(), username, "AUTH", "[logout] success");
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), username, "AUTH", "[logout] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<AuthHistoryResponse> getUserHistory(Long userId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "AUTH", "[get.user.history] userId: " + userId);
        try {
            List<AuthHistoryResponse> responses = authHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .map(AuthHistoryResponse::from)
                    .toList();

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "AUTH", "[get.user.history] count: " + responses.size());
            return responses;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "AUTH", "[get.user.history] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<AuthHistoryResponse> getAllHistory() {
        LogUtility.info(this.getClass().getName(), "SYSTEM", "AUTH", "[get.all.history] request received");
        try {
            List<AuthHistoryResponse> responses = authHistoryRepository.findAll().stream()
                    .map(AuthHistoryResponse::from)
                    .toList();

            LogUtility.info(this.getClass().getName(), "SYSTEM", "AUTH", "[get.all.history] count: " + responses.size());
            return responses;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), "SYSTEM", "AUTH", "[get.all.history] Exception: " + ex.getMessage());
            throw ex;
        }
    }
}