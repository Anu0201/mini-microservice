package com.anudari.payment_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InvoiceItemRequest(
        @NotBlank String name,
        @Min(1) Integer qty,
        @NotNull BigDecimal unitPrice
) {}