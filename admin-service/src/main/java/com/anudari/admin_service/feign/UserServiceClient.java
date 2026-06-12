package com.anudari.admin_service.feign;

import com.anudari.admin_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceClient {

    @GetMapping("/api/users")
    List<UserResponse> getAllUsers();

    @GetMapping("/api/users/{id}")
    UserResponse getUserById(@PathVariable Long id);
}