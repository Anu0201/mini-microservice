package com.anudari.payment_service.feign;

import java.math.BigDecimal;

public record DebitRequest(Long accountId, Long userId, BigDecimal amount) {}
