package com.anudari.payment_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments/invoices")
@RequiredArgsConstructor
public class UserInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/mine")
    public ResponseEntity<List<InvoiceResponse>> listMine(
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(invoiceService.listMine(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getOne(
            @PathVariable Long id,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        return ResponseEntity.ok(invoiceService.getOne(id, userId));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<InvoiceResponse> pay(
            @PathVariable Long id,
            @RequestHeader(value = AppConstants.HEADER.AUTH_USER_ID, required = false) Long userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(invoiceService.pay(id, userId));
    }
}
