package com.anudari.user_service.dto;

import com.anudari.common.constant.CurrencyType;
import com.anudari.user_service.entity.Account;

import java.math.BigDecimal;

public record AccountResponse(Long id, String accountNumber, CurrencyType currency, BigDecimal balance) {
    
    public static AccountResponse from(Account account) {
        return new AccountResponse(account.getId(), account.getAccountNumber(), account.getCurrency(), account.getBalance());
    }
}
