package com.anudari.payment_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SendInvoiceRequest(
        @NotBlank String receiverPhone,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String currency,
        String description,
        @NotNull(message = "receiverAccountId is required — specify which account to receive payment into") Long receiverAccountId
) {}