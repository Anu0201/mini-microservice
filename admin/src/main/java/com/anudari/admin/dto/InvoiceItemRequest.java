package com.anudari.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InvoiceItemRequest {
    @NotBlank
    private String name;
    @Min(1)
    private Integer qty;
    @NotNull
    private BigDecimal unitPrice;
}
