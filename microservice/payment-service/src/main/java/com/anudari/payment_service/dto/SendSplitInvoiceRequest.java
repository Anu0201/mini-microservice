package com.anudari.payment_service.dto;

import java.math.BigDecimal;
import java.util.List;

public record SendSplitInvoiceRequest(
        List<String> phones,
        Integer participantCount,
        BigDecimal totalAmount,
        String currency,
        String description,
        Long receiverAccountId
) {
}