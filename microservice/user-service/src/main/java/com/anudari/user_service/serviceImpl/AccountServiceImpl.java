package com.anudari.user_service.serviceImpl;

import com.anudari.user_service.config.AppProperties;
import com.anudari.user_service.constant.TransactionType;
import com.anudari.user_service.dto.AccountResponse;
import com.anudari.user_service.dto.AccountTransactionRequest;
import com.anudari.user_service.dto.AccountTransactionResponse;
import com.anudari.user_service.dto.CreateAccountRequest;
import com.anudari.user_service.dto.CreditRequest;
import com.anudari.user_service.dto.DebitRequest;
import com.anudari.user_service.entity.Account;
import com.anudari.user_service.entity.AccountTransaction;
import com.anudari.user_service.entity.User;
import com.anudari.user_service.repository.AccountRepository;
import com.anudari.user_service.repository.AccountTransactionRepository;
import com.anudari.user_service.repository.UserRepository;
import com.anudari.user_service.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final AccountTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public AccountResponse createAccount(Long userId, CreateAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Edge case: нэг currency-д зөвхөн нэг данс
        if (accountRepository.existsByUser_UserIdAndCurrency(userId, request.currency())) {
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
        return accountRepository.findAllByUser_UserId(userId).stream()
                .map(AccountResponse::from)
                .toList();
    }

    @Override
    public AccountResponse getAccount(Long accountId, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getUserId(), requesterId, isAdmin);
        return AccountResponse.from(account);
    }

    @Override
    @Transactional
    public AccountResponse deposit(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getUserId(), requesterId, isAdmin);

        BigDecimal before = account.getBalance();
        account.setBalance(before.add(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.DEPOSIT, request.amount(), before, account.getBalance(), "Deposit");
        return AccountResponse.from(account);
    }

    @Override
    @Transactional
    public AccountResponse withdraw(Long accountId, AccountTransactionRequest request, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getUserId(), requesterId, isAdmin);

        if (account.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient balance. Available: " + account.getBalance() + ", requested: " + request.amount()
            );
        }

        BigDecimal before = account.getBalance();
        account.setBalance(before.subtract(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.WITHDRAW, request.amount(), before, account.getBalance(), "Withdrawal");
        return AccountResponse.from(account);
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

    @Override
    @Transactional
    public void debitForInvoice(DebitRequest request, String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException("Invalid internal secret");
        }

        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new NoSuchElementException("Account not found: " + request.accountId()));

        if (!account.getUser().getUserId().equals(request.userId())) {
            throw new SecurityException("Account does not belong to user");
        }

        if (account.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient balance. Available: " + account.getBalance() + ", required: " + request.amount()
            );
        }

        BigDecimal before = account.getBalance();
        account.setBalance(before.subtract(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.INVOICE_DEBIT, request.amount(), before, account.getBalance(), "Invoice payment");
    }

    @Override
    @Transactional
    public void creditForInvoice(CreditRequest request, String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException("Invalid internal secret");
        }

        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new NoSuchElementException("Account not found: " + request.accountId()));

        if (!account.getUser().getUserId().equals(request.userId())) {
            throw new SecurityException("Account does not belong to user");
        }

        BigDecimal before = account.getBalance();
        account.setBalance(before.add(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.INVOICE_CREDIT, request.amount(), before, account.getBalance(), "Invoice received");
    }

    @Override
    public List<AccountTransactionResponse> getTransactions(Long accountId, Long requesterId, String isAdmin) {
        Account account = findAccount(accountId);
        checkAccess(account.getUser().getUserId(), requesterId, isAdmin);
        return transactionRepository.findAllByAccount_AccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(AccountTransactionResponse::from)
                .toList();
    }

    private void recordTransaction(Account account, TransactionType type, BigDecimal amount,
                                   BigDecimal before, BigDecimal after, String description) {
        transactionRepository.save(AccountTransaction.builder()
                .account(account)
                .type(type)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .description(description)
                .build());
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateUniqueAccountNumber() {
        String number;
        do {
            number = "MN" + String.format("%010d", (long) (RANDOM.nextDouble() * 10_000_000_000L));
        } while (accountRepository.findByAccountNumber(number).isPresent());
        return number;
    }
}
