package com.anudari.admin.serviceImpl;

import com.anudari.admin.constant.Headers;
import com.anudari.admin.dto.CreateInvoiceRequest;
import com.anudari.admin.dto.InvoiceResponse;
import com.anudari.admin.service.AdminInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AdminInvoiceServiceImpl implements AdminInvoiceService {

    private final RestTemplate restTemplate;

    @Value("${app.internal-secret}")
    private String internalSecret;

    @Value("${payment-service.url}")
    private String paymentServiceUrl;

    @Override
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(Headers.INTERNAL_SECRET, internalSecret);

        HttpEntity<CreateInvoiceRequest> entity = new HttpEntity<>(request, headers);

        return restTemplate.postForObject(paymentServiceUrl + "/api/payments/invoices", entity, InvoiceResponse.class);
    }
}
