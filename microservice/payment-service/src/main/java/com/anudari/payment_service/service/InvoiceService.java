package com.anudari.payment_service.service;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;

import java.util.List;

public interface InvoiceService {
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
    InvoiceResponse sendUserInvoice(SendInvoiceRequest request, Long senderId);
    List<InvoiceResponse> listAllInvoices();
    List<InvoiceResponse> listUserInvoices(Long userId);
    List<InvoiceResponse> listSentInvoices(Long senderId);
    InvoiceResponse getInvoiceById(Long invoiceId, Long userId);
    InvoiceResponse payInvoice(Long invoiceId, Long userId, String idempotencyKey);
    InvoiceResponse cancelInvoice(Long invoiceId);
    InvoiceResponse cancelUserInvoice(Long invoiceId, Long senderId);
}