package com.anudari.payment_service.service;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;

import java.util.List;

public interface InvoiceService {
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
    List<InvoiceResponse> listAllInvoices();
    List<InvoiceResponse> listUserInvoices(Long userId);
    InvoiceResponse getInvoiceById(Long invoiceId, Long userId);
    InvoiceResponse payInvoice(Long invoiceId, Long userId, String idempotencyKey);
    InvoiceResponse cancelInvoice(Long invoiceId);
}