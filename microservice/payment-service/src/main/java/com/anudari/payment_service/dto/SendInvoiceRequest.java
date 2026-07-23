package com.anudari.payment_service.dto;

import java.math.BigDecimal;

public record SendInvoiceRequest(
        String receiverPhone,
        BigDecimal amount,
        String currency,
        String description,
        Long receiverAccountId
) {}