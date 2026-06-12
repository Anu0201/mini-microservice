package com.anudari.payment_service.dto;

import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.enums.InvoiceStatus;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Value
public class InvoiceResponse {
    Long                     id;
    String                   invoiceNumber;
    Long                     userId;
    BigDecimal               amount;
    String                   currency;
    InvoiceStatus            status;
    String                   description;
    LocalDate                dueDate;
    List<InvoiceItemResponse> items;
    LocalDateTime            createdAt;

    public static InvoiceResponse from(Invoice invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getUserId(),
                invoice.getAmount(),
                invoice.getCurrency(),
                invoice.getStatus(),
                invoice.getDescription(),
                invoice.getDueDate(),
                invoice.getItems().stream().map(InvoiceItemResponse::from).toList(),
                invoice.getCreatedAt());
    }
}