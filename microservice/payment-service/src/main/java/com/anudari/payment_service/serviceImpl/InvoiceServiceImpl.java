package com.anudari.payment_service.serviceImpl;

import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;
import com.anudari.common.constant.InvoiceStatus;
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
            userServiceClient.getUserById(request.userId(), "true");
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("User not found: " + request.userId());
        }

        List<InvoiceItem> items = request.items().stream()
                .map(i -> InvoiceItem.builder()
                        .name(i.name())
                        .qty(i.qty())
                        .unitPrice(i.unitPrice())
                        .lineTotal(i.unitPrice().multiply(BigDecimal.valueOf(i.qty())))
                        .build())
                .toList();

        BigDecimal total = items.stream()
                .map(InvoiceItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .userId(request.userId())
                .amount(total)
                .currency(request.currency() != null ? request.currency() : "MNT")
                .description(request.description())
                .dueDate(request.dueDate())
                .status(new InvoiceStatus.Unpaid())
                .build();

        items.forEach(item -> item.setInvoice(invoice));
        invoice.getItems().addAll(items);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public InvoiceResponse sendUserInvoice(SendInvoiceRequest request, Long senderId) {
        try {
            userServiceClient.getUserById(request.receiverId(), "true");
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("User not found: " + request.receiverId());
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .senderId(senderId)
                .userId(request.receiverId())
                .amount(request.amount())
                .currency(request.currency() != null ? request.currency() : "MNT")
                .description(request.description())
                .status(new InvoiceStatus.Unpaid())
                .build();

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Override
    public List<InvoiceResponse> listSentInvoices(Long senderId) {
        return invoiceRepository.findBySenderId(senderId).stream()
                .map(InvoiceResponse::from)
                .toList();
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
        if (userId != null && !invoice.getUserId().equals(userId) && !userId.equals(invoice.getSenderId())) {
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
        if (!(invoice.getStatus() instanceof InvoiceStatus.Unpaid)) {
            throw new IllegalStateException("Invoice is not payable: " + invoice.getStatus().value());
        }

        invoice.setStatus(new InvoiceStatus.Paid());
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
        if (invoice.getStatus() instanceof InvoiceStatus.Paid) {
            throw new IllegalStateException("Cannot cancel a paid invoice");
        }
        invoice.setStatus(new InvoiceStatus.Cancelled());
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    private Invoice findById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NoSuchElementException("Invoice not found: " + invoiceId));
    }
}