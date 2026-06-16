package com.anudari.user_service.serviceImpl;

import com.anudari.common.constant.AppConstants;
import com.anudari.user_service.dto.RegisterRequest;
import com.anudari.user_service.dto.UpdateUserRequest;
import com.anudari.user_service.dto.UserInternalResponse;
import com.anudari.user_service.dto.UserResponse;
import com.anudari.user_service.entity.User;
import com.anudari.user_service.repository.UserRepository;
import com.anudari.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Override
    public UserResponse register(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(Set.of(AppConstants.ROLE.USER));
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setEmail(request.getEmail());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse getUser(String username) {
        return userRepository.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    @Override
    public UserInternalResponse internalSearch(String username, String secretToken) {
        if (secretToken == null || !secretToken.equals(internalSecret)) {
            throw new SecurityException("Access Denied");
        }
        return userRepository.findByUsername(username)
                .map(UserInternalResponse::from)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }
}