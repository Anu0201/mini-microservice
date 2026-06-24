package com.anudari.payment_service.dto;

import com.anudari.payment_service.entity.InvoiceItem;

import java.math.BigDecimal;

public record InvoiceItemResponse(Long id, String name, Integer qty, BigDecimal unitPrice, BigDecimal lineTotal) {

    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(), item.getName(),
                item.getQty(), item.getUnitPrice(), item.getLineTotal());
    }
}