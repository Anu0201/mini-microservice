package com.anudari.admin.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long userId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String description;
    private LocalDate dueDate;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;
}
