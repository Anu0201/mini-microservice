package com.anudari.payment_service.dto;

import java.math.BigDecimal;
import java.util.List;

public record SendSplitInvoiceRequest(
        List<String> phones,
        BigDecimal totalAmount,
        String currency,
        String description,
        Long receiverAccountId
) {
}