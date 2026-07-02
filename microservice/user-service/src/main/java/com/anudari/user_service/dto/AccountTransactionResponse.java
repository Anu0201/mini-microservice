package com.anudari.user_service.dto;

import com.anudari.common.constant.TransactionType;
import com.anudari.user_service.entity.AccountTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountTransactionResponse(
        Long transactionId,
        TransactionType type,
        BigDecimal amount,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        String description,
        LocalDateTime createdAt
) {
    public static AccountTransactionResponse from(AccountTransaction tx) {
        return new AccountTransactionResponse(
                tx.getTransactionId(),
                tx.getType(),
                tx.getAmount(),
                tx.getBalanceBefore(),
                tx.getBalanceAfter(),
                tx.getDescription(),
                tx.getCreatedAt()
        );
    }
}
