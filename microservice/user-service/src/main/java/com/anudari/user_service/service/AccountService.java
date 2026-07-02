package com.anudari.user_service.service;

import com.anudari.user_service.dto.AccountResponse;
import com.anudari.user_service.dto.AccountTransactionRequest;
import com.anudari.user_service.dto.CreateAccountRequest;

import java.util.List;

public interface AccountService {

    AccountResponse createAccount(Long userId, CreateAccountRequest request);

    List<AccountResponse> getAccountsByUser(Long userId, Long requesterId, String isAdmin);

    AccountResponse getAccount(Long accountId, Long requesterId, String isAdmin);

    AccountResponse deposit(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin);

    AccountResponse withdraw(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin);
}
