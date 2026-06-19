package com.anudari.admin.service;

import com.anudari.admin.dto.CreateInvoiceRequest;
import com.anudari.admin.dto.InvoiceResponse;

public interface AdminInvoiceService {
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
}
