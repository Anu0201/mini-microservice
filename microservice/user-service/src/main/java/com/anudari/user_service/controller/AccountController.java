package com.anudari.user_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.user_service.dto.AccountResponse;
import com.anudari.user_service.dto.AccountTransactionRequest;
import com.anudari.user_service.dto.AccountTransactionResponse;
import com.anudari.user_service.dto.CreateAccountRequest;
import com.anudari.user_service.dto.CreditRequest;
import com.anudari.user_service.dto.DebitRequest;
import com.anudari.user_service.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/users/{userId}")
    public ResponseEntity<AccountResponse> createAccount(
            @PathVariable Long userId,
            @Valid @RequestBody CreateAccountRequest request,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        if (!"true".equals(isAdmin) && !userId.equals(requesterId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.createAccount(userId, request));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<AccountResponse>> getAccountsByUser(
            @PathVariable Long userId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        return ResponseEntity.ok(accountService.getAccountsByUser(userId, requesterId, isAdmin));
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponse> getAccount(
            @PathVariable Long accountId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        return ResponseEntity.ok(accountService.getAccount(accountId, requesterId, isAdmin));
    }

    @PostMapping("/{accountId}/deposit")
    public ResponseEntity<AccountResponse> deposit(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountTransactionRequest request,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        return ResponseEntity.ok(accountService.deposit(accountId, request, requesterId, isAdmin));
    }

    @PostMapping("/{accountId}/withdraw")
    public ResponseEntity<AccountResponse> withdraw(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountTransactionRequest request,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        return ResponseEntity.ok(accountService.withdraw(accountId, request, requesterId, isAdmin));
    }

    @PostMapping("/internal/debit")
    public ResponseEntity<Void> internalDebit(
            @Valid @RequestBody DebitRequest request,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secret) {
        accountService.debitForInvoice(request, secret);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<List<AccountTransactionResponse>> getTransactions(
            @PathVariable Long accountId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long requesterId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_IS_ADMIN, required = false) String isAdmin) {
        return ResponseEntity.ok(accountService.getTransactions(accountId, requesterId, isAdmin));
    }

    @PostMapping("/internal/credit")
    public ResponseEntity<Void> internalCredit(
            @Valid @RequestBody CreditRequest request,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secret) {
        accountService.creditForInvoice(request, secret);
        return ResponseEntity.noContent().build();
    }
}
