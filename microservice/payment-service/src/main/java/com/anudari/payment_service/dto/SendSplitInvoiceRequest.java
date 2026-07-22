package com.anudari.payment_service.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record SendSplitInvoiceRequest(

        @NotEmpty(message = "Дор хаяж нэг утасны дугаар шаардлагатай")
        List<@NotBlank(message = "Хоосон утасны дугаар байж болохгүй") String> phones,

        @DecimalMin(value = "0.01", message = "Нийт дүн 0-ээс их байх ёстой")
        BigDecimal totalAmount,

        String currency,
        String description,

        @NotNull(message = "Хүлээн авах дансаа сонгоно уу")
        Long receiverAccountId

) {
}
