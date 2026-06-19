package com.anudari.auth_service.feign;

import com.anudari.auth_service.dto.UserInternalDto;
import com.anudari.common.constant.AppConstants;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service", url = "${user-service.url}")
public interface UserClient {
    //login hiihed hereglegchiin password iig shalgahiin tuld user-service-s medeelel avah heregtei.
    //credentialHash-iig avch password shalgadag dotood internal holboosoos user-service-g shuud holbono
    @GetMapping("/api/users/internal/by-username/{username}")
    UserInternalDto findByUsernameInternal(
            @PathVariable String username,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );
}