package com.anudari.payment_service.feign;

import java.math.BigDecimal;

public record CreditRequest(Long accountId, Long userId, BigDecimal amount) {}
