package com.anudari.user_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.user_service.dto.RegisterRequest;
import com.anudari.user_service.dto.UpdateUserRequest;
import com.anudari.user_service.dto.UserInternalResponse;
import com.anudari.user_service.dto.UserResponse;
import com.anudari.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    // Admin (only callable by admin-service, proven via shared internal secret)
    @GetMapping
    public CompletableFuture<ResponseEntity<List<UserResponse>>> listAllUsers(
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secretToken) {
        return userService.listAllUsers(secretToken)
                .thenApply(ResponseEntity::ok);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getUser(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USERNAME, required = false) String username) {
        log.info("[THREAD] name={} virtual={}", Thread.currentThread().getName(), Thread.currentThread().isVirtual());
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getUser(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        if (!"true".equals(isAdmin) && !id.equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        if (!"true".equals(isAdmin) && !id.equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @GetMapping("/internal/by-username/{username}")
    public ResponseEntity<UserInternalResponse> internalLookup(
            @PathVariable String username,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secretToken) {
        return ResponseEntity.ok(userService.internalSearch(username, secretToken));
    }

    @GetMapping("/internal/by-phone/{phoneNumber}")
    public ResponseEntity<UserInternalResponse> internalLookupByPhone(
            @PathVariable String phoneNumber,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secretToken) {
        return ResponseEntity.ok(userService.internalSearchByPhone(phoneNumber, secretToken));
    }
}