package com.anudari.payment_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;
import com.anudari.payment_service.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/payments/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @Value("${app.internal-secret}")
    private String internalSecret;

    // Admin-service ees duudagdana

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secret) {
        requireInternalSecret(secret);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(request));
    }

    @GetMapping
    public CompletableFuture<ResponseEntity<List<InvoiceResponse>>> listAllInvoices(
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secret) {
        requireInternalSecret(secret);
        return invoiceService.listAllInvoices().thenApply(ResponseEntity::ok);
    }

    @PostMapping("/{invoiceId}/cancel")
    public ResponseEntity<InvoiceResponse> cancelInvoice(
            @PathVariable Long invoiceId,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secret) {
        requireInternalSecret(secret);
        return ResponseEntity.ok(invoiceService.cancelInvoice(invoiceId));
    }

    private void requireInternalSecret(String secret) {
        if (secret == null || !secret.equals(internalSecret)) {
            throw new SecurityException("Access denied");
        }
    }

    // User

    @PostMapping("/{invoiceId}/cancel/user")
    public ResponseEntity<InvoiceResponse> cancelUserInvoice(
            @PathVariable Long invoiceId,
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long senderId) {
        return ResponseEntity.ok(invoiceService.cancelUserInvoice(invoiceId, senderId));
    }

    @PostMapping("/send")
    public ResponseEntity<InvoiceResponse> sendUserInvoice(
            @Valid @RequestBody SendInvoiceRequest request,
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long senderId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.sendUserInvoice(request, senderId));
    }

    @GetMapping("/user")
    public CompletableFuture<ResponseEntity<List<InvoiceResponse>>> listUserInvoices(
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId) {
        return invoiceService.listUserInvoices(userId).thenApply(ResponseEntity::ok);
    }

    @GetMapping("/sent")
    public CompletableFuture<ResponseEntity<List<InvoiceResponse>>> listSentInvoices(
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long senderId) {
        return invoiceService.listSentInvoices(senderId).thenApply(ResponseEntity::ok);
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
