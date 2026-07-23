package com.anudari.user_service.serviceImpl;

import com.anudari.common.constant.AppConstants;
import com.anudari.user_service.config.AppProperties;
import com.anudari.user_service.dto.RegisterRequest;
import com.anudari.user_service.dto.UpdateUserRequest;
import com.anudari.user_service.dto.UserInternalResponse;
import com.anudari.user_service.dto.UserLookupResponse;
import com.anudari.user_service.dto.UserResponse;
import com.anudari.user_service.entity.User;
import com.anudari.user_service.repository.UserRepository;
import com.anudari.user_service.service.UserService;
import com.anudari.user_service.util.MessageUtility;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public UserResponse register(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(AppConstants.ROLE.USER));
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
        user.setEmail(request.email());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse getUser(String username) {
        return userRepository.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
    }

    @Override
    public UserLookupResponse lookupByPhone(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
                .map(UserLookupResponse::from)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
    }

    @Override
    public UserInternalResponse internalSearch(String username, String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException(MessageUtility.getMessage("access.denied"));
        }
        return userRepository.findByUsername(username)
                .map(UserInternalResponse::from)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
    }

    @Override
    public UserInternalResponse internalSearchByPhone(String phoneNumber, String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException(MessageUtility.getMessage("access.denied"));
        }
        return userRepository.findByPhoneNumber(phoneNumber)
                .map(UserInternalResponse::from)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found.phone", new Object[]{phoneNumber})));
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<UserResponse>> listAllUsers(String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException(MessageUtility.getMessage("access.denied"));
        }
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
        return CompletableFuture.completedFuture(users);
    }
}