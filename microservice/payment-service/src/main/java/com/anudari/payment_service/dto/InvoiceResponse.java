package com.anudari.payment_service.dto;

import com.anudari.common.utility.StringUtility;
import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.feign.UserIdResponse;
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
    private String senderInitials;
    private String senderProfileImageUrl;
    private String receiverName;
    private String receiverInitials;
    private String receiverProfileImageUrl;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String description;
    private LocalDate dueDate;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;

    public static InvoiceResponse from(Invoice invoice) {
        return from(invoice, (String) null, null, null, null);
    }

    public static InvoiceResponse from(Invoice invoice, String senderName) {
        return from(invoice, senderName, null, null, null);
    }

    public static InvoiceResponse from(Invoice invoice, String senderName, String receiverName) {
        return from(invoice, senderName, null, receiverName, null);
    }

    public static InvoiceResponse from(Invoice invoice, UserIdResponse sender, UserIdResponse receiver) {
        String senderName = sender != null ? sender.fullName() : null;
        String receiverName = receiver != null ? receiver.fullName() : null;
        return from(invoice, senderName, sender != null ? sender.profileImageUrl() : null,
                receiverName, receiver != null ? receiver.profileImageUrl() : null);
    }

    public static InvoiceResponse from(Invoice invoice, String senderName, String senderProfileImageUrl,
                                       String receiverName, String receiverProfileImageUrl) {
        return InvoiceResponse.builder()
                .id(invoice.getInvoiceId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .userId(invoice.getUserId())
                .senderId(invoice.getSenderId())
                .senderName(senderName)
                .senderInitials(StringUtility.initials(senderName))
                .senderProfileImageUrl(senderProfileImageUrl)
                .receiverName(receiverName)
                .receiverInitials(StringUtility.initials(receiverName))
                .receiverProfileImageUrl(receiverProfileImageUrl)
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