package com.anudari.user_service.serviceImpl;

import com.anudari.common.constant.AppConstants;
import com.anudari.common.utility.LogUtility;
import com.anudari.common.utility.JSONUtility;
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
        LogUtility.info(this.getClass().getName(), request.username(), "USER", "[register] " + JSONUtility.toJSON(request));
        try {
            User user = new User();
            user.setUsername(request.username());
            user.setEmail(request.email());
            user.setPhoneNumber(request.phoneNumber());
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setRoles(Set.of(AppConstants.ROLE.USER));

            UserResponse response = UserResponse.from(userRepository.save(user));

            LogUtility.info(this.getClass().getName(), request.username(), "USER", "[register] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), request.username(), "USER", "[register] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserResponse getUserById(Long id) {
        LogUtility.info(this.getClass().getName(), String.valueOf(id), "USER", "[get.user.by.id] id: " + id);
        try {
            UserResponse response = userRepository.findById(id)
                    .map(UserResponse::from)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));

            LogUtility.info(this.getClass().getName(), String.valueOf(id), "USER", "[get.user.by.id] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(id), "USER", "[get.user.by.id] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        LogUtility.info(this.getClass().getName(), String.valueOf(id), "USER", "[update.user] " + JSONUtility.toJSON(request));
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));
            user.setEmail(request.email());

            UserResponse response = UserResponse.from(userRepository.save(user));

            LogUtility.info(this.getClass().getName(), String.valueOf(id), "USER", "[update.user] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(id), "USER", "[update.user] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserResponse getUser(String username) {
        LogUtility.info(this.getClass().getName(), username, "USER", "[get.user] username: " + username);
        try {
            UserResponse response = userRepository.findByUsername(username)
                    .map(UserResponse::from)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));

            LogUtility.info(this.getClass().getName(), username, "USER", "[get.user] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), username, "USER", "[get.user] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserLookupResponse lookupByPhone(String phoneNumber) {
        LogUtility.info(this.getClass().getName(), phoneNumber, "USER", "[lookup.by.phone] phoneNumber: " + phoneNumber);
        try {
            UserLookupResponse response = userRepository.findByPhoneNumber(phoneNumber)
                    .map(UserLookupResponse::from)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));

            LogUtility.info(this.getClass().getName(), phoneNumber, "USER", "[lookup.by.phone] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), phoneNumber, "USER", "[lookup.by.phone] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserInternalResponse internalSearch(String username, String secretToken) {
        LogUtility.info(this.getClass().getName(), username, "USER", "[internal.search] username: " + username);
        try {
            if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
                throw new SecurityException(MessageUtility.getMessage("access.denied"));
            }
            UserInternalResponse response = userRepository.findByUsername(username)
                    .map(UserInternalResponse::from)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));

            LogUtility.info(this.getClass().getName(), username, "USER", "[internal.search] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), username, "USER", "[internal.search] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public UserInternalResponse internalSearchByPhone(String phoneNumber, String secretToken) {
        LogUtility.info(this.getClass().getName(), phoneNumber, "USER", "[internal.search.by.phone] phoneNumber: " + phoneNumber);
        try {
            if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
                throw new SecurityException(MessageUtility.getMessage("access.denied"));
            }
            UserInternalResponse response = userRepository.findByPhoneNumber(phoneNumber)
                    .map(UserInternalResponse::from)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found.phone", new Object[]{phoneNumber})));

            LogUtility.info(this.getClass().getName(), phoneNumber, "USER", "[internal.search.by.phone] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), phoneNumber, "USER", "[internal.search.by.phone] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<UserResponse>> listAllUsers(String secretToken) {
        LogUtility.info(this.getClass().getName(), "SYSTEM", "USER", "[list.all.users] request received");
        try {
            if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
                throw new SecurityException(MessageUtility.getMessage("access.denied"));
            }
            List<UserResponse> users = userRepository.findAll().stream()
                    .map(UserResponse::from)
                    .toList();

            LogUtility.info(this.getClass().getName(), "SYSTEM", "USER", "[list.all.users] count: " + users.size());
            return CompletableFuture.completedFuture(users);
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), "SYSTEM", "USER", "[list.all.users] Exception: " + ex.getMessage());
            throw ex;
        }
    }
}