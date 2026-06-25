package com.anudari.payment_service.converter;

import com.anudari.common.constant.InvoiceStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InvoiceStatusConverter implements AttributeConverter<InvoiceStatus, String> {

    @Override
    public String convertToDatabaseColumn(InvoiceStatus status) {
        return status.value();
    }

    @Override
    public InvoiceStatus convertToEntityAttribute(String value) {
        return switch (value) {
            case "UNPAID"    -> new InvoiceStatus.Unpaid();
            case "PAID"      -> new InvoiceStatus.Paid();
            case "CANCELLED" -> new InvoiceStatus.Cancelled();
            default -> throw new IllegalArgumentException("Unknown invoice status: " + value);
        };
    }
}