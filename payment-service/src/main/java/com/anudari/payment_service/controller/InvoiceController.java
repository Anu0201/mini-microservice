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
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    //Admin endpoints (/api/payments/admin/invoices/**)

    @PostMapping("/admin/invoices")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(request));
    }

    @GetMapping("/admin/invoices")
    public ResponseEntity<List<InvoiceResponse>> listAllInvoices() {
        return ResponseEntity.ok(invoiceService.listAllInvoices());
    }

    @GetMapping("/admin/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceByIdAsAdmin(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(invoiceId, null));
    }

    @PostMapping("/admin/invoices/{invoiceId}/cancel")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(invoiceId));
    }

    //User endpoints (/api/payments/invoices/**)

    @GetMapping("/invoices/user")
    public ResponseEntity<List<InvoiceResponse>> listUserInvoices(
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId) {
        return ResponseEntity.ok(invoiceService.listUserInvoices(userId));
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long invoiceId,
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(invoiceId, userId));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    public ResponseEntity<InvoiceResponse> payInvoice(
            @PathVariable Long invoiceId,
            @RequestHeader(AppConstants.HEADER.AUTH_USER_ID) Long userId) {
        return ResponseEntity.ok(invoiceService.payInvoice(invoiceId, userId));
    }
}