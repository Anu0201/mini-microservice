package com.anudari.payment_service.service;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;

import java.util.List;

public interface InvoiceService {
    InvoiceResponse create(CreateInvoiceRequest request);
    List<InvoiceResponse> listAll();
    List<InvoiceResponse> listMine(Long userId);
    InvoiceResponse getOne(Long id, Long userId);
    InvoiceResponse pay(Long id, Long userId);
    InvoiceResponse cancel(Long id);
}