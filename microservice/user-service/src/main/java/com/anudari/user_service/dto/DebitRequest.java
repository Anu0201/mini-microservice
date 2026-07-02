package com.anudari.user_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record DebitRequest(
        @NotNull Long accountId,
        @NotNull Long userId,
        @NotNull @DecimalMin("0.01") BigDecimal amount
) {}
