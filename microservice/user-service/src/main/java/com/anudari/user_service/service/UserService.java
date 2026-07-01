package com.anudari.user_service.service;

import com.anudari.user_service.dto.RegisterRequest;
import com.anudari.user_service.dto.UpdateUserRequest;
import com.anudari.user_service.dto.UserInternalResponse;
import com.anudari.user_service.dto.UserResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface UserService {

    UserResponse register(RegisterRequest request);

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    UserResponse getUser(String username);

    UserInternalResponse internalSearch(String username, String secretToken);

    UserInternalResponse internalSearchByPhone(String phoneNumber, String secretToken);

    CompletableFuture<List<UserResponse>> listAllUsers(String secretToken);
}