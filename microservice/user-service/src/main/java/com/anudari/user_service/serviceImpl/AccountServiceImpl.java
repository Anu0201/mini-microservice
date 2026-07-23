package com.anudari.user_service.serviceImpl;

import com.anudari.user_service.config.AppProperties;
import com.anudari.common.constant.TransactionType;
import com.anudari.common.utility.LogUtility;
import com.anudari.common.utility.JSONUtility;
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
import com.anudari.user_service.util.MessageUtility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.NoSuchElementException;

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
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "ACCOUNT",
                "[create.account] " + JSONUtility.toJSON(request));
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("user.not.found")));

            if (accountRepository.existsByUser_UserIdAndCurrency(userId, request.currency())) {
                throw new IllegalStateException(
                        MessageUtility.getMessage("account.exists", new Object[]{request.currency()})
                );
            }

            Account account = Account.builder()
                    .accountNumber(generateUniqueAccountNumber())
                    .currency(request.currency())
                    .user(user)
                    .build();

            AccountResponse response = AccountResponse.from(accountRepository.save(account));

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "ACCOUNT",
                    "[create.account] " + JSONUtility.toJSON(response));

            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "ACCOUNT",
                    "[create.account] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<AccountResponse> getAccountsByUser(Long userId, Long requesterId, String isAdmin) {
        checkAccess(userId, requesterId, isAdmin);
        if (!userRepository.existsById(userId)) {
            throw new NoSuchElementException(MessageUtility.getMessage("user.not.found"));
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

        checkSufficientBalance(account, request.amount());

        BigDecimal before = account.getBalance();
        account.setBalance(before.subtract(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.WITHDRAW, request.amount(), before, account.getBalance(), "Withdrawal");
        return AccountResponse.from(account);
    }

    private void checkSufficientBalance(Account account, BigDecimal requestedAmount) {
        if (account.getBalance().compareTo(requestedAmount) < 0) {
            throw new IllegalArgumentException(
                    MessageUtility.getMessage("balance.insufficient.detail",
                            new Object[]{account.getBalance(), requestedAmount})
            );
        }
    }

    private Account findAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("account.not.found")));
    }

    private void checkAccess(Long ownerId, Long requesterId, String isAdmin) {
        if (!"true".equals(isAdmin) && !ownerId.equals(requesterId)) {
            throw new SecurityException(MessageUtility.getMessage("access.denied"));
        }
    }

    @Override
    @Transactional
    public void debitForInvoice(DebitRequest request, String secretToken) {
        Account account = validateAndGetAccount(request.accountId(), request.userId(), secretToken);

        checkSufficientBalance(account, request.amount());

        BigDecimal before = account.getBalance();
        account.setBalance(before.subtract(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.INVOICE_DEBIT, request.amount(), before, account.getBalance(), "Invoice payment");
    }

    @Override
    @Transactional
    public void creditForInvoice(CreditRequest request, String secretToken) {
        Account account = validateAndGetAccount(request.accountId(), request.userId(), secretToken);

        BigDecimal before = account.getBalance();
        account.setBalance(before.add(request.amount()));
        accountRepository.save(account);

        recordTransaction(account, TransactionType.INVOICE_CREDIT, request.amount(), before, account.getBalance(), "Invoice payment");
    }

    private Account validateAndGetAccount(Long accountId, Long userId, String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException(MessageUtility.getMessage("secret.invalid"));
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("account.not.found", new Object[]{accountId})));

        if (!account.getUser().getUserId().equals(userId)) {
            throw new SecurityException(MessageUtility.getMessage("account.ownership.mismatch"));
        }

        return account;
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
