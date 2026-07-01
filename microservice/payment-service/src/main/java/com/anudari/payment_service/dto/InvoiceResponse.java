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
    private BigDecimal amount;
    private String currency;
    private String status;
    private String description;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdDate;

    public static InvoiceResponse from(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getInvoiceId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .userId(invoice.getUserId())
                .senderId(invoice.getSenderId())
                .amount(invoice.getAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus().value())
                .description(invoice.getDescription())
                .items(invoice.getItems().stream().map(InvoiceItemResponse::from).toList())
                .createdDate(invoice.getCreatedDate())
                .build();
    }
}