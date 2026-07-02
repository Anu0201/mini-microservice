package com.anudari.payment_service.feign;

import com.anudari.common.constant.CurrencyType;

import java.math.BigDecimal;

public record AccountInfo(Long accountId, String accountNumber, CurrencyType currency, BigDecimal balance) {}
