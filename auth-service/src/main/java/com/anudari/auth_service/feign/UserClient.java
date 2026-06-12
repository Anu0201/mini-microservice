package com.anudari.auth_service.feign;

import com.anudari.auth_service.dto.UserInternalDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import com.anudari.common.constant.AppConstants;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserClient {

    @GetMapping("/api/users/internal/search")
    UserInternalDto findByUsernameInternal(
            @RequestParam("username") String username,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );
}