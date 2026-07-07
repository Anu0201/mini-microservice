package com.anudari.payment_service.feign;

import com.anudari.common.constant.AppConstants;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @GetMapping("/api/accounts/{accountId}")
    AccountInfo getAccountById(
            @PathVariable Long accountId,
            @RequestHeader(AppConstants.HEADER.AUTH_IS_ADMIN) String isAdmin
    );

    @PostMapping("/api/accounts/internal/debit")
    void debitAccount(
            @RequestBody DebitRequest request,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );

    @PostMapping("/api/accounts/internal/credit")
    void creditAccount(
            @RequestBody CreditRequest request,
            @RequestHeader(AppConstants.HEADER.INTERNAL_SECRET) String internalSecret
    );

    @GetMapping("/api/accounts/users/{userId}")
    java.util.List<AccountInfo> getAccountsByUserId(
            @PathVariable Long userId,
            @RequestHeader(AppConstants.HEADER.AUTH_IS_ADMIN) String isAdmin
    );
}