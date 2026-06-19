package com.anudari.admin.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class InvoiceItemResponse {
    private Long id;
    private String name;
    private Integer qty;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
