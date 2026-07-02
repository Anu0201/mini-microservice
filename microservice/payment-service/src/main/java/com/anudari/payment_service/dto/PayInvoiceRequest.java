package com.anudari.payment_service.dto;

import jakarta.validation.constraints.NotNull;

public record PayInvoiceRequest(@NotNull(message = "accountId is required") Long accountId) {}
