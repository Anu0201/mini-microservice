package com.anudari.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateInvoiceRequest {
    @NotNull
    private Long userId;
    private String description;
    private LocalDate dueDate;
    private String currency;
    @NotEmpty
    @Valid
    private List<InvoiceItemRequest> items;
}
