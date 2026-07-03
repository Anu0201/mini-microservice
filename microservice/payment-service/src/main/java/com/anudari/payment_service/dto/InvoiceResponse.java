package com.anudari.payment_service.dto;

import com.anudari.payment_service.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long userId;
    private Long senderId;
    private String senderName;
    private String receiverName;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String description;
    private LocalDate dueDate;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;

    public static InvoiceResponse from(Invoice invoice) {
        return from(invoice, null, null);
    }

    public static InvoiceResponse from(Invoice invoice, String senderName) {
        return from(invoice, senderName, null);
    }

    public static InvoiceResponse from(Invoice invoice, String senderName, String receiverName) {
        return InvoiceResponse.builder()
                .id(invoice.getInvoiceId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .userId(invoice.getUserId())
                .senderId(invoice.getSenderId())
                .senderName(senderName)
                .receiverName(receiverName)
                .amount(invoice.getAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus().value())
                .description(invoice.getDescription())
                .dueDate(invoice.getDueDate())
                .items(invoice.getItems().stream().map(InvoiceItemResponse::from).toList())
                .createdAt(invoice.getCreatedDate())
                .build();
    }
}