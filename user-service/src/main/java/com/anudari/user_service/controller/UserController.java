package com.anudari.user_service.controller;

import com.anudari.user_service.dto.RegisterRequest;
import com.anudari.user_service.dto.UpdateUserRequest;
import com.anudari.user_service.dto.UserInternalResponse;
import com.anudari.user_service.dto.UserResponse;
import com.anudari.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    // Username is forwarded by the gateway as a trusted header after JWT validation
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(
            @RequestHeader(value = "X-Auth-Username", required = false) String username) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getMe(username));
    }

    @GetMapping("/internal/search")
    public ResponseEntity<UserInternalResponse> internalLookup(
            @RequestParam String username,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secretToken) {
        return ResponseEntity.ok(userService.internalSearch(username, secretToken));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}