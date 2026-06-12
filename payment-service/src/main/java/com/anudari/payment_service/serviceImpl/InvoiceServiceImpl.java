package com.anudari.payment_service.serviceImpl;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.entity.InvoiceItem;
import com.anudari.payment_service.entity.Payment;
import com.anudari.payment_service.enums.InvoiceStatus;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request) {
        try {
            userServiceClient.getUserById(request.getUserId());
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
                .status(InvoiceStatus.UNPAID)
                .build();

        items.forEach(item -> item.setInvoice(invoice));
        invoice.getItems().addAll(items);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    public List<InvoiceResponse> listAll() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Override
    public List<InvoiceResponse> listMine(Long userId) {
        return invoiceRepository.findByUserId(userId).stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Override
    public InvoiceResponse getOne(Long id, Long userId) {
        Invoice invoice = findById(id);
        if (userId != null && !invoice.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        return InvoiceResponse.from(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse pay(Long id, Long userId) {
        Invoice invoice = findById(id);

        if (!invoice.getUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        if (invoice.getStatus() != InvoiceStatus.UNPAID) {
            throw new IllegalStateException("Invoice is not payable: " + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.PAID);
        paymentRepository.save(Payment.builder()
                .invoice(invoice)
                .userId(userId)
                .amount(invoice.getAmount())
                .build());

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public InvoiceResponse cancel(Long id) {
        Invoice invoice = findById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot cancel a paid invoice");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    private Invoice findById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + id));
    }
}