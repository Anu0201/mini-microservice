package com.anudari.payment_service.serviceImpl;

import com.anudari.payment_service.config.AppProperties;
import com.anudari.payment_service.exchange.ExchangeRateClient;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendInvoiceRequest;
import com.anudari.payment_service.dto.SendMoneyRequest;
import com.anudari.payment_service.dto.SendSplitInvoiceRequest;
import com.anudari.payment_service.dto.TransferResponse;
import com.anudari.common.constant.InvoiceStatus;
import com.anudari.common.utility.LogUtility;
import com.anudari.common.utility.JSONUtility;
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
import com.anudari.payment_service.util.MessageUtility;
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
    private final MessageUtility MessageUtility;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        LogUtility.info(this.getClass().getName(), String.valueOf(request.userId()), "INVOICE", "[create.invoice] " + JSONUtility.toJSON(request));
        try {
            try {
                userServiceClient.getUserById(request.userId(), "true");
            } catch (FeignException.NotFound e) {
                throw new NoSuchElementException(MessageUtility.getMessage("user.not.found", new Object[]{request.userId()}));
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

            InvoiceResponse response = InvoiceResponse.from(invoiceRepository.save(invoice));

            LogUtility.info(this.getClass().getName(), String.valueOf(request.userId()), "INVOICE", "[create.invoice] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(request.userId()), "INVOICE", "[create.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public InvoiceResponse sendUserInvoice(SendInvoiceRequest request, Long senderId, String idempotencyKey) {
        LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.user.invoice] " + JSONUtility.toJSON(request));
        try {
            validateSendInvoiceRequest(request);

            String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
            if (normalizedIdempotencyKey != null) {
                Optional<Invoice> existing = invoiceRepository.findFirstBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(senderId, normalizedIdempotencyKey);
                if (existing.isPresent()) {
                    InvoiceResponse existingResponse = InvoiceResponse.from(existing.get());
                    LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.user.invoice] idempotent hit: " + JSONUtility.toJSON(existingResponse));
                    return existingResponse;
                }
            }
            Invoice invoice = buildUserInvoice(request, senderId, normalizedIdempotencyKey);
            InvoiceResponse response = InvoiceResponse.from(invoiceRepository.save(invoice));

            LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.user.invoice] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.user.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public List<InvoiceResponse> splitInvoice(SendSplitInvoiceRequest request, Long senderId, String idempotencyKey) {
        LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[split.invoice] " + JSONUtility.toJSON(request));
        try {
            validateSplitInvoiceRequest(request);
            String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
            if (normalizedIdempotencyKey != null) {
                List<Invoice> existing = invoiceRepository.findBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(senderId, normalizedIdempotencyKey);
                if (!existing.isEmpty()) {
                    List<InvoiceResponse> existingResponses = existing.stream().map(InvoiceResponse::from).toList();
                    LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[split.invoice] idempotent hit: " + JSONUtility.toJSON(existingResponses));
                    return existingResponses;
                }
            }

            List<String> phones = request.phones().stream()
                    .map(String::trim)
                    .filter(phone -> !phone.isEmpty())
                    .toList();

            if (phones.isEmpty()) {
                throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.phone.required"));
            }

            BigDecimal totalAmount = request.totalAmount().setScale(2, RoundingMode.HALF_UP);
            long totalCents = totalAmount.movePointRight(2).longValueExact();

            int receiversCount = phones.size();
            int participantCount = request.participantCount();

            long baseCents = totalCents / participantCount;
            long remainderCents = totalCents % participantCount;

            List<InvoiceResponse> responses = java.util.stream.IntStream.range(0, receiversCount)
                    .mapToObj(index -> {
                        long amountCents = baseCents + (index < remainderCents ? 1 : 0);
                        BigDecimal splitAmount = BigDecimal.valueOf(amountCents, 2);
                        SendInvoiceRequest splitRequest = new SendInvoiceRequest(
                                phones.get(index),
                                splitAmount,
                                request.currency(),
                                request.description(),
                                request.receiverAccountId()
                        );
                        Invoice invoice = buildUserInvoice(splitRequest, senderId, normalizedIdempotencyKey);
                        return InvoiceResponse.from(invoiceRepository.save(invoice));
                    })
                    .toList();

            LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[split.invoice] " + JSONUtility.toJSON(responses));
            return responses;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[split.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    private void validateSplitInvoiceRequest(SendSplitInvoiceRequest request) {
        if (request.phones() == null || request.phones().isEmpty()) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.phones.notempty"));
        }
        boolean hasBlankPhone = request.phones().stream()
                .anyMatch(phone -> phone == null || phone.trim().isEmpty());
        if (hasBlankPhone) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.phone.notblank"));
        }
        if (request.totalAmount() == null || request.totalAmount().compareTo(new BigDecimal("0.01")) < 0) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.amount.min"));
        }
        if (request.receiverAccountId() == null) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.receiverAccountId.notnull"));
        }
        if (request.participantCount() == null || request.participantCount() < 1) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.participantCount.notnull"));
        }
        if (request.participantCount() < request.phones().size()) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.split.participantCount.invalid"));
        }
    }

    private void validateSendInvoiceRequest(SendInvoiceRequest request) {
        if (request.receiverPhone() == null || request.receiverPhone().trim().isEmpty()) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.send.receiverPhone.required"));
        }
        if (request.amount() == null || request.amount().compareTo(new BigDecimal("0.01")) < 0) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.send.amount.min"));
        }
        if (request.receiverAccountId() == null) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.send.receiverAccountId.required"));
        }
    }

    private Invoice buildUserInvoice(SendInvoiceRequest request, Long senderId, String idempotencyKey) {
        UserIdResponse receiver;
        try {
            receiver = userServiceClient.getUserByPhone(request.receiverPhone(), appProperties.getInternalSecret());
        } catch (FeignException.NotFound e) {
            throw new NoSuchElementException(MessageUtility.getMessage("user.not.found.phone", new Object[]{request.receiverPhone()}));
        }

        if (senderId.equals(receiver.userId())) {
            throw new IllegalArgumentException(MessageUtility.getMessage("invoice.self.send.forbidden"));
        }

        return Invoice.builder()
                .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .senderId(senderId)
                .userId(receiver.userId())
                .amount(request.amount())
                .currency(request.currency() != null ? request.currency() : "MNT")
                .description(request.description())
                .receiverAccountId(request.receiverAccountId())
                .idempotencyKey(idempotencyKey)
                .status(new InvoiceStatus.Unpaid())
                .build();
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }
        String trimmed = idempotencyKey.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listSentInvoices(Long senderId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[list.sent.invoices] senderId: " + senderId);
        try {
            List<InvoiceResponse> responses = invoiceRepository.findBySenderId(senderId).stream()
                    .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId()), fetchSenderName(inv.getUserId())))
                    .toList();

            LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[list.sent.invoices] count: " + responses.size());
            return CompletableFuture.completedFuture(responses);
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[list.sent.invoices] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listAllInvoices() {
        LogUtility.info(this.getClass().getName(), "SYSTEM", "INVOICE", "[list.all.invoices] request received");
        try {
            List<InvoiceResponse> responses = invoiceRepository.findAllWithItems().stream()
                    .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId())))
                    .toList();

            LogUtility.info(this.getClass().getName(), "SYSTEM", "INVOICE", "[list.all.invoices] count: " + responses.size());
            return CompletableFuture.completedFuture(responses);
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), "SYSTEM", "INVOICE", "[list.all.invoices] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Async("asyncExecutor")
    @Override
    public CompletableFuture<List<InvoiceResponse>> listUserInvoices(Long userId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[list.user.invoices] userId: " + userId);
        try {
            List<InvoiceResponse> responses = invoiceRepository.findByUserId(userId).stream()
                    .map(inv -> InvoiceResponse.from(inv, fetchSenderName(inv.getSenderId())))
                    .toList();

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[list.user.invoices] count: " + responses.size());
            return CompletableFuture.completedFuture(responses);
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[list.user.invoices] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    public InvoiceResponse getInvoiceById(Long invoiceId, Long userId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[get.invoice.by.id] invoiceId: " + invoiceId);
        try {
            Invoice invoice = findById(invoiceId);
            if (userId != null && !invoice.getUserId().equals(userId) && !userId.equals(invoice.getSenderId())) {
                throw new SecurityException(MessageUtility.getMessage("invoice.access.denied"));
            }
            InvoiceResponse response = InvoiceResponse.from(invoice, fetchSenderName(invoice.getSenderId()));

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[get.invoice.by.id] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[get.invoice.by.id] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public InvoiceResponse payInvoice(Long invoiceId, Long accountId, Long userId, String idempotencyKey) {
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[pay.invoice] invoiceId: " + invoiceId + ", accountId: " + accountId);
        try {
            if (accountId == null) {
                throw new IllegalArgumentException(MessageUtility.getMessage("invoice.pay.accountId.required"));
            }
            if (idempotencyKey != null) {
                Optional<Payment> existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
                if (existing.isPresent()) {
                    InvoiceResponse existingResponse = InvoiceResponse.from(existing.get().getInvoice());
                    LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[pay.invoice] idempotent hit: " + JSONUtility.toJSON(existingResponse));
                    return existingResponse;
                }
            }

            Invoice invoice = findById(invoiceId);

            if (!invoice.getUserId().equals(userId)) {
                throw new SecurityException(MessageUtility.getMessage("invoice.access.denied"));
            }
            if (!(invoice.getStatus() instanceof InvoiceStatus.Unpaid)) {
                throw new IllegalStateException(MessageUtility.getMessage("invoice.not.payable", new Object[]{invoice.getStatus().value()}));
            }

            AccountInfo account;
            try {
                account = userServiceClient.getAccountById(accountId, "true");
            } catch (FeignException.NotFound e) {
                throw new NoSuchElementException(MessageUtility.getMessage("account.not.found", new Object[]{accountId}));
            }

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
                throw new IllegalStateException(MessageUtility.getMessage("invoice.balance.insufficient"));
            }

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

            InvoiceResponse response = InvoiceResponse.from(invoiceRepository.save(invoice));

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[pay.invoice] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[pay.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public InvoiceResponse cancelInvoice(Long invoiceId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(invoiceId), "INVOICE", "[cancel.invoice] invoiceId: " + invoiceId);
        try {
            Invoice invoice = findById(invoiceId);
            if (invoice.getStatus() instanceof InvoiceStatus.Paid) {
                throw new IllegalStateException(MessageUtility.getMessage("invoice.cancel.paid.forbidden"));
            }
            invoice.setStatus(new InvoiceStatus.Cancelled());
            InvoiceResponse response = InvoiceResponse.from(invoiceRepository.save(invoice));

            LogUtility.info(this.getClass().getName(), String.valueOf(invoiceId), "INVOICE", "[cancel.invoice] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(invoiceId), "INVOICE", "[cancel.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public TransferResponse sendMoney(SendMoneyRequest request, Long senderId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.money] " + JSONUtility.toJSON(request));
        try {
            UserIdResponse receiver;
            try {
                receiver = userServiceClient.getUserByPhone(request.receiverPhone(), appProperties.getInternalSecret());
            } catch (FeignException.NotFound e) {
                throw new NoSuchElementException(MessageUtility.getMessage("user.not.found.phone", new Object[]{request.receiverPhone()}));
            }

            if (senderId.equals(receiver.userId())) {
                throw new IllegalArgumentException(MessageUtility.getMessage("money.self.send.forbidden"));
            }

            String currency = request.currency() != null ? request.currency() : "MNT";

            AccountInfo receiverAccount = userServiceClient.getAccountsByUserId(receiver.userId(), "true")
                    .stream()
                    .filter(a -> a.currency().name().equals(currency))
                    .findFirst()
                    .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("account.currency.not.found", new Object[]{currency})));

            AccountInfo senderAccount;
            try {
                senderAccount = userServiceClient.getAccountById(request.senderAccountId(), "true");
            } catch (FeignException.NotFound e) {
                throw new NoSuchElementException(MessageUtility.getMessage("account.sender.not.found", new Object[]{request.senderAccountId()}));
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
                throw new IllegalStateException(MessageUtility.getMessage("balance.insufficient"));
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

            TransferResponse response = new TransferResponse(saved.getInvoiceId(), request.receiverPhone(), request.amount(), currency, request.description(), "SUCCESS");

            LogUtility.info(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.money] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(senderId), "INVOICE", "[send.money] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public InvoiceResponse cancelUserInvoice(Long invoiceId, Long userId) {
        LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[cancel.user.invoice] invoiceId: " + invoiceId);
        try {
            Invoice invoice = findById(invoiceId);
            boolean isSender = userId.equals(invoice.getSenderId());
            boolean isReceiver = userId.equals(invoice.getUserId());
            if (!isSender && !isReceiver) {
                throw new SecurityException(MessageUtility.getMessage("invoice.cancel.access.denied"));
            }
            if (invoice.getStatus() instanceof InvoiceStatus.Paid) {
                throw new IllegalStateException(MessageUtility.getMessage("invoice.cancel.paid.forbidden"));
            }
            invoice.setStatus(new InvoiceStatus.Cancelled());
            InvoiceResponse response = InvoiceResponse.from(invoiceRepository.save(invoice));

            LogUtility.info(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[cancel.user.invoice] " + JSONUtility.toJSON(response));
            return response;
        } catch (Exception ex) {
            LogUtility.error(this.getClass().getName(), String.valueOf(userId), "INVOICE", "[cancel.user.invoice] Exception: " + ex.getMessage());
            throw ex;
        }
    }

    private Invoice findById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NoSuchElementException(MessageUtility.getMessage("invoice.not.found", new Object[]{invoiceId})));
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