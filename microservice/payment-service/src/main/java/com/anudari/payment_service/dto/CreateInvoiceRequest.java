package com.anudari.payment_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateInvoiceRequest(
        @NotNull Long userId,
        String description,
        LocalDate dueDate,
        String currency,
        @NotEmpty @Valid List<InvoiceItemRequest> items
) {}