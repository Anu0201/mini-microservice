package com.anudari.auth_service.feign;

import com.anudari.auth_service.dto.UserInternalDto;
import com.anudari.common.constant.AppConstants;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/internal/by-username/{username}")
    UserInternalDto findByUsernameInternal(
            @PathVariable("username") String username,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );
}