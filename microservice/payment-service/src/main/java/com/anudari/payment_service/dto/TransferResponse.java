package com.anudari.payment_service.dto;

import java.math.BigDecimal;

public record TransferResponse(
        Long transferId,
        String receiverPhone,
        BigDecimal amount,
        String currency,
        String description,
        String status
) {}