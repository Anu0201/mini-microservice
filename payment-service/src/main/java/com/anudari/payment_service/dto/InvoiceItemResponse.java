package com.anudari.payment_service.dto;

import com.anudari.payment_service.entity.InvoiceItem;
import lombok.Value;

import java.math.BigDecimal;

@Value
public class InvoiceItemResponse {
    Long       id;
    String     name;
    Integer    qty;
    BigDecimal unitPrice;
    BigDecimal lineTotal;

    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(), item.getName(),
                item.getQty(), item.getUnitPrice(), item.getLineTotal());
    }
}