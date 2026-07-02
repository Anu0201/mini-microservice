package com.anudari.user_service.serviceImpl;

import com.anudari.user_service.dto.AccountResponse;
import com.anudari.user_service.dto.AccountTransactionRequest;
import com.anudari.user_service.dto.CreateAccountRequest;
import com.anudari.user_service.entity.Account;
import com.anudari.user_service.entity.User;
import com.anudari.user_service.repository.AccountRepository;
import com.anudari.user_service.repository.UserRepository;
import com.anudari.user_service.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AccountResponse createAccount(Long userId, CreateAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Edge case: нэг currency-д зөвхөн нэг данс
        if (accountRepository.existsByUserIdAndCurrency(userId, request.currency())) {
            throw new IllegalStateException(
                    "Account with currency " + request.currency() + " already exists for this user"
            );
        }

        Account account = Account.builder()
                .accountNumber(generateUniqueAccountNumber())
                .currency(request.currency())
                .user(user)
                .build();

        return AccountResponse.from(accountRepository.save(account));
    }

    @Override
    public List<AccountResponse> getAccountsByUser(Long userId, Long requesterId, String isAdmin) {
        checkAccess(userId, requesterId, isAdmin);
        if (!userRepository.existsById(userId)) {
            throw new NoSuchElementException("User not found");
        }
        return accountRepository.findAllByUserId(userId).stream()
                .map(AccountResponse::from)
                .toList();
    }

    @Override
    public AccountResponse getAccount(Long accountId, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getId(), requesterId, isAdmin);
        return AccountResponse.from(account);
    }

    @Override
    @Transactional
    public AccountResponse deposit(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getId(), requesterId, isAdmin);

        account.setBalance(account.getBalance().add(request.amount()));
        return AccountResponse.from(accountRepository.save(account));
    }

    @Override
    @Transactional
    public AccountResponse withdraw(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getId(), requesterId, isAdmin);

        // Edge case: balance хүрэлцэхгүй
        if (account.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient balance. Available: " + account.getBalance() + ", requested: " + request.amount()
            );
        }

        account.setBalance(account.getBalance().subtract(request.amount()));
        return AccountResponse.from(accountRepository.save(account));
    }

    private Account findAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new NoSuchElementException("Account not found"));
    }

    // Edge case: зөвхөн эзэн эсвэл admin хандах боломжтой
    private void checkAccess(Long ownerId, Long requesterId, String isAdmin) {
        if (!"true".equals(isAdmin) && !ownerId.equals(requesterId)) {
            throw new SecurityException("Access denied");
        }
    }

    private String generateUniqueAccountNumber() {
        String number;
        do {
            number = "MN" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        } while (accountRepository.findByAccountNumber(number).isPresent());
        return number;
    }
}
