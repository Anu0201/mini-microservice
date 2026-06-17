package com.anudari.payment_service.serviceImpl;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.common.constant.AppConstants.*;
import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.entity.InvoiceItem;
import com.anudari.payment_service.entity.Payment;
import com.anudari.payment_service.feign.UserServiceClient;
import com.anudari.payment_service.repository.InvoiceRepository;
import com.anudari.payment_service.repository.PaymentRepository;
import com.anudari.payment_service.service.InvoiceService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        try {
            userServiceClient.getUserById(request.getUserId(), "true");
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("User not found: " + request.getUserId());
        }

        List<InvoiceItem> items = request.getItems().stream()
                .map(i -> InvoiceItem.builder()
                        .name(i.getName())
                        .qty(i.getQty())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQty())))
                        .build())
                .toList();

        BigDecimal total = items.stream()
                .map(InvoiceItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .userId(request.getUserId())
                .amount(total)
                .currency(request.getCurrency() != null ? request.getCurrency() : "MNT")
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(INVOICE_STATUS.UNPAID)
                .build();

        items.forEach(item -> item.setInvoice(invoice));
        invoice.getItems().addAll(items);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    public List<InvoiceResponse> listAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Override
    public List<InvoiceResponse> listUserInvoices(Long userId) {
        return invoiceRepository.findByUserId(userId).stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Override
    public InvoiceResponse getInvoiceById(Long invoiceId, Long userId) {
        Invoice invoice = findById(invoiceId);
        if (userId != null && !invoice.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        return InvoiceResponse.from(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse payInvoice(Long invoiceId, Long userId, String idempotencyKey) {
        if (idempotencyKey != null) {
            Optional<Payment> existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return InvoiceResponse.from(existing.get().getInvoice());
            }
        }

        Invoice invoice = findById(invoiceId);

        if (!invoice.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        if (!INVOICE_STATUS.UNPAID.equals(invoice.getStatus())) {
            throw new IllegalStateException("Invoice is not payable: " + invoice.getStatus());
        }

        invoice.setStatus(INVOICE_STATUS.PAID);
        paymentRepository.save(Payment.builder()
                .invoice(invoice)
                .userId(userId)
                .amount(invoice.getAmount())
                .idempotencyKey(idempotencyKey)
                .build());

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public InvoiceResponse cancelInvoice(Long invoiceId) {
        Invoice invoice = findById(invoiceId);
        if (INVOICE_STATUS.PAID.equals(invoice.getStatus())) {
            throw new IllegalStateException("Cannot cancel a paid invoice");
        }
        invoice.setStatus(INVOICE_STATUS.CANCELLED);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    private Invoice findById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + invoiceId));
    }
}