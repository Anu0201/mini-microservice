package com.anudari.payment_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

import java.math.BigDecimal;

@Value
public class InvoiceItemRequest {
    @NotBlank String name;
    @Min(1)   Integer qty;
    @NotNull  BigDecimal unitPrice;
}