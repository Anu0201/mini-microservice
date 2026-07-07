package com.anudari.payment_service.serviceImpl;

import com.anudari.payment_service.config.AppProperties;
import com.anudari.payment_service.exchange.ExchangeRateClient;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;
import com.anudari.payment_service.dto.SendMoneyRequest;
import com.anudari.payment_service.dto.TransferResponse;
import com.anudari.common.constant.InvoiceStatus;
import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.entity.InvoiceItem;
import com.anudari.payment_service.entity.Payment;
import com.anudari.payment_service.feign.AccountInfo;
import com.anudari.payment_service.feign.CreditRequest;
import com.anudari.payment_service.feign.DebitRequest;
import com.anudari.payment_service.feign.UserIdResponse;
import com.anudari.payment_service.feign.UserServiceClient;
import com.anudari.payment_service.repository.InvoiceRepository;
import com.anudari.payment_service.repository.PaymentRepository;
import com.anudari.payment_service.service.InvoiceService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserServiceClient userServiceClient;
    private final AppProperties appProperties;
    private final ExchangeRateClient exchangeRateClient;

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
        UserIdResponse receiver;
        try {
            receiver = userServiceClient.getUserByPhone(request.receiverPhone(), appProperties.getInternalSecret());
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("User not found with phone: " + request.receiverPhone());
        }

        if (senderId.equals(receiver.userId())) {
            throw new IllegalArgumentException("Cannot send an invoice to yourself");
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .senderId(senderId)
                .userId(receiver.userId())
                .amount(request.amount())
                .currency(request.currency() != null ? request.currency() : "MNT")
                .description(request.description())
                .receiverAccountId(request.receiverAccountId())
                .status(new InvoiceStatus.Unpaid())
                .build();

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listSentInvoices(Long senderId) {
        return CompletableFuture.completedFuture(
                invoiceRepository.findBySenderId(senderId).stream()
                        .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId()), fetchSenderName(inv.getUserId())))
                        .toList()
        );
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listAllInvoices() {
        return CompletableFuture.completedFuture(
                invoiceRepository.findAllWithItems().stream()
                        .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId())))
                        .toList()
        );
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listUserInvoices(Long userId) {
        return CompletableFuture.completedFuture(
                invoiceRepository.findByUserId(userId).stream()
                        .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId())))
                        .toList()
        );
    }

    @Override
    public InvoiceResponse getInvoiceById(Long invoiceId, Long userId) {
        Invoice invoice = findById(invoiceId);
        if (userId != null && !invoice.getUserId().equals(userId) && !userId.equals(invoice.getSenderId())) {
            throw new SecurityException("Access denied");
        }
        return InvoiceResponse.from(invoice, fetchSenderName(invoice.getSenderId()));
    }

    @Override
    @Transactional
    public InvoiceResponse payInvoice(Long invoiceId, Long accountId, Long userId, String idempotencyKey) {
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

        AccountInfo account;
        try {
            account = userServiceClient.getAccountById(accountId, "true");
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("Account not found: " + accountId);
        }

        // Currency conversion: invoice currency → account currency
        BigDecimal debitAmount;
        String invoiceCurrency = invoice.getCurrency();
        String accountCurrency = account.currency().name();

        if (invoiceCurrency.equals(accountCurrency)) {
            debitAmount = invoice.getAmount();
        } else {
            BigDecimal rate = exchangeRateClient.getConversionRate(invoiceCurrency, accountCurrency);
            debitAmount = invoice.getAmount().multiply(rate).setScale(2, RoundingMode.HALF_UP);
        }

        try {
            userServiceClient.debitAccount(
                    new DebitRequest(accountId, userId, debitAmount),
                    appProperties.getInternalSecret()
            );
        } catch (FeignException.BadRequest e) {
            throw new IllegalStateException("Insufficient balance to pay this invoice");
        }

        // Credit the invoice sender's account if specified
        if (invoice.getReceiverAccountId() != null && invoice.getSenderId() != null) {
            userServiceClient.creditAccount(
                    new CreditRequest(invoice.getReceiverAccountId(), invoice.getSenderId(), invoice.getAmount()),
                    appProperties.getInternalSecret()
            );
        }

        invoice.setStatus(new InvoiceStatus.Paid());
        paymentRepository.save(Payment.builder()
                .invoice(invoice)
                .userId(userId)
                .amount(debitAmount)
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

    @Override
    @Transactional
    public TransferResponse sendMoney(SendMoneyRequest request, Long senderId) {
        UserIdResponse receiver;
        try {
            receiver = userServiceClient.getUserByPhone(request.receiverPhone(), appProperties.getInternalSecret());
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("User not found with phone: " + request.receiverPhone());
        }

        if (senderId.equals(receiver.userId())) {
            throw new IllegalArgumentException("Cannot send money to yourself");
        }

        String currency = request.currency() != null ? request.currency() : "MNT";

        AccountInfo receiverAccount = userServiceClient.getAccountsByUserId(receiver.userId(), "true")
                .stream()
                .filter(a -> a.currency().name().equals(currency))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Receiver has no " + currency + " account"));

        // Convert amount to sender account's currency if they differ
        AccountInfo senderAccount;
        try {
            senderAccount = userServiceClient.getAccountById(request.senderAccountId(), "true");
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException("Sender account not found: " + request.senderAccountId());
        }

        String senderCurrency = senderAccount.currency().name();
        BigDecimal debitAmount;
        if (senderCurrency.equals(currency)) {
            debitAmount = request.amount();
        } else {
            BigDecimal rate = exchangeRateClient.getConversionRate(currency, senderCurrency);
            debitAmount = request.amount().multiply(rate).setScale(2, RoundingMode.HALF_UP);
        }

        try {
            userServiceClient.debitAccount(
                    new DebitRequest(request.senderAccountId(), senderId, debitAmount),
                    appProperties.getInternalSecret()
            );
        } catch (FeignException.BadRequest e) {
            throw new IllegalStateException("Insufficient balance");
        }

        userServiceClient.creditAccount(
                new CreditRequest(receiverAccount.accountId(), receiver.userId(), request.amount()),
                appProperties.getInternalSecret()
        );

        Invoice invoice = Invoice.builder()
                .invoiceNumber("TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .senderId(senderId)
                .userId(receiver.userId())
                .amount(request.amount())
                .currency(currency)
                .description(request.description())
                .receiverAccountId(receiverAccount.accountId())
                .status(new InvoiceStatus.Paid())
                .build();

        Invoice saved = invoiceRepository.save(invoice);

        paymentRepository.save(Payment.builder()
                .invoice(saved)
                .userId(senderId)
                .amount(request.amount())
                .method("DIRECT_TRANSFER")
                .build());

        return new TransferResponse(saved.getInvoiceId(), request.receiverPhone(), request.amount(), currency, request.description(), "SUCCESS");
    }

    @Override
    @Transactional
    public InvoiceResponse cancelUserInvoice(Long invoiceId, Long userId) {
        Invoice invoice = findById(invoiceId);
        boolean isSender = userId.equals(invoice.getSenderId());
        boolean isReceiver = userId.equals(invoice.getUserId());
        if (!isSender && !isReceiver) {
            throw new SecurityException("You can only cancel your own invoices");
        }
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

    private String fetchSenderName(Long senderId) {
        if (senderId == null) return null;
        try {
            return userServiceClient.getUserById(senderId, "true").username();
        } catch (Exception e) {
            return null;
        }
    }
}