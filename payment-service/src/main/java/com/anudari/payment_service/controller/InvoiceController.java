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
public class InvoiceController {

    private final InvoiceService invoiceService;

    // Admin

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(request));
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> listAllInvoices() {
        return ResponseEntity.ok(invoiceService.listAllInvoices());
    }

    @PostMapping("/{invoiceId}/cancel")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(invoiceId));
    }

    // User

    @GetMapping("/user")
    public ResponseEntity<List<InvoiceResponse>> listUserInvoices(
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId) {
        return ResponseEntity.ok(invoiceService.listUserInvoices(userId));
    }

    @PostMapping("/{invoiceId}/pay")
    public ResponseEntity<InvoiceResponse> payInvoice(
            @PathVariable Long invoiceId,
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId,
            @RequestHeader(value = AppConstants.HEADER.IDEMPOTENCY_KEY, required = false) String idempotencyKey) {
        return ResponseEntity.ok(invoiceService.payInvoice(invoiceId, userId, idempotencyKey));
    }

    //hoyulaa

    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long invoiceId,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(invoiceId, userId));
    }
}
