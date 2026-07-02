package com.anudari.payment_service.feign;

import com.anudari.common.constant.AppConstants;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service", url = "${user-service.url}")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    UserIdResponse getUserById(
            @PathVariable Long id,
            @RequestHeader(AppConstants.HEADER.AUTH_IS_ADMIN) String isAdmin
    );

    @GetMapping("/api/users/internal/by-phone/{phoneNumber}")
    UserIdResponse getUserByPhone(
            @PathVariable String phoneNumber,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );
}