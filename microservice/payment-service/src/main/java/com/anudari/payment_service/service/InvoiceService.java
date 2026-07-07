package com.anudari.payment_service.service;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;
import com.anudari.payment_service.dto.SendMoneyRequest;
import com.anudari.payment_service.dto.TransferResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface InvoiceService {
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
    InvoiceResponse sendUserInvoice(SendInvoiceRequest request, Long senderId);
    TransferResponse sendMoney(SendMoneyRequest request, Long senderId);
    CompletableFuture<List<InvoiceResponse>> listAllInvoices();
    CompletableFuture<List<InvoiceResponse>> listUserInvoices(Long userId);
    CompletableFuture<List<InvoiceResponse>> listSentInvoices(Long senderId);
    InvoiceResponse getInvoiceById(Long invoiceId, Long userId);
    InvoiceResponse payInvoice(Long invoiceId, Long accountId, Long userId, String idempotencyKey);
    InvoiceResponse cancelInvoice(Long invoiceId);
    InvoiceResponse cancelUserInvoice(Long invoiceId, Long senderId);
}