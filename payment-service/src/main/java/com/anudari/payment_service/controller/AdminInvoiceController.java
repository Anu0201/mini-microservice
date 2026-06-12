package com.anudari.payment_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments/invoices")
@RequiredArgsConstructor
public class AdminInvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId,
            @Valid @RequestBody CreateInvoiceRequest request) {
        if (userId != null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> listAll(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        if (userId != null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(invoiceService.listAll());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<InvoiceResponse> cancel(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId,
            @PathVariable Long id) {
        if (userId != null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(invoiceService.cancel(id));
    }
}