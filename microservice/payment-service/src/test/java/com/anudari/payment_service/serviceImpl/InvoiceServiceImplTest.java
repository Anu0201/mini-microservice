package com.anudari.payment_service.serviceImpl;

import com.anudari.common.constant.CurrencyType;
import com.anudari.common.constant.InvoiceStatus;
import com.anudari.payment_service.config.AppProperties;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceItemRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.dto.SendSplitInvoiceRequest;
import com.anudari.payment_service.entity.Invoice;
import com.anudari.payment_service.entity.InvoiceItem;
import com.anudari.payment_service.entity.Payment;
import com.anudari.payment_service.exchange.ExchangeRateClient;
import com.anudari.payment_service.feign.AccountInfo;
import com.anudari.payment_service.feign.UserIdResponse;
import com.anudari.payment_service.feign.UserServiceClient;
import com.anudari.payment_service.repository.InvoiceRepository;
import com.anudari.payment_service.repository.PaymentRepository;
import feign.FeignException;
import feign.Request;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserServiceClient userServiceClient;
    @Mock
    private AppProperties appProperties;
    @Mock
    private ExchangeRateClient exchangeRateClient;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    @Captor
    private ArgumentCaptor<Invoice> invoiceCaptor;

    private CreateInvoiceRequest createRequest;

    @BeforeEach
    void setUp() {
        createRequest = new CreateInvoiceRequest(
                42L, "desc", LocalDate.now().plusDays(7), null,
                List.of(new InvoiceItemRequest("Widget", 2, BigDecimal.valueOf(10))));
    }

    @Test
    void createInvoice_savesInvoiceWithComputedTotalAndDefaultCurrency() {
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse response = invoiceService.createInvoice(createRequest);

        verify(userServiceClient).getUserById(42L, "true");
        verify(invoiceRepository).save(invoiceCaptor.capture());
        Invoice saved = invoiceCaptor.getValue();
        assertThat(saved.getUserId()).isEqualTo(42L);
        assertThat(saved.getAmount()).isEqualByComparingTo("20");
        assertThat(saved.getCurrency()).isEqualTo("MNT");
        assertThat(saved.getStatus().value()).isEqualTo("UNPAID");
        assertThat(saved.getInvoiceNumber()).startsWith("INV-");
        assertThat(saved.getItems()).hasSize(1);
        assertThat(response.getAmount()).isEqualByComparingTo("20");
    }

    @Test
    void createInvoice_usesRequestedCurrencyWhenProvided() {
        CreateInvoiceRequest withCurrency = new CreateInvoiceRequest(
                42L, "desc", null, "USD",
                List.of(new InvoiceItemRequest("Widget", 1, BigDecimal.TEN)));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        invoiceService.createInvoice(withCurrency);

        verify(invoiceRepository).save(invoiceCaptor.capture());
        assertThat(invoiceCaptor.getValue().getCurrency()).isEqualTo("USD");
    }

    @Test
    void createInvoice_throwsWhenUserNotFound() {
        when(userServiceClient.getUserById(anyLong(), any()))
                .thenThrow(feignNotFound());

        assertThatThrownBy(() -> invoiceService.createInvoice(createRequest))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("42");

        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void listUserInvoices_mapsRepositoryResults() throws Exception {
        Invoice invoice = invoiceWithId(1L, 7L, "UNPAID");
        when(invoiceRepository.findByUserId(7L)).thenReturn(List.of(invoice));

        List<InvoiceResponse> result = invoiceService.listUserInvoices(7L).get();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(7L);
    }

    @Test
    void listAllInvoices_mapsAllRepositoryResults() throws Exception {
        when(invoiceRepository.findAllWithItems()).thenReturn(List.of(invoiceWithId(1L, 7L, "UNPAID"), invoiceWithId(2L, 8L, "PAID")));

        List<InvoiceResponse> result = invoiceService.listAllInvoices().get();

        assertThat(result).hasSize(2);
    }

    @Test
    void getInvoiceById_returnsInvoiceForOwningUser() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "UNPAID")));

        InvoiceResponse response = invoiceService.getInvoiceById(1L, 7L);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void getInvoiceById_throwsSecurityExceptionForOtherUser() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "UNPAID")));

        assertThatThrownBy(() -> invoiceService.getInvoiceById(1L, 999L))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    void getInvoiceById_allowsNullUserId() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "UNPAID")));

        InvoiceResponse response = invoiceService.getInvoiceById(1L, null);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void getInvoiceById_throwsWhenInvoiceMissing() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.getInvoiceById(99L, 7L))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void payInvoice_marksInvoicePaidAndRecordsPayment() {
        Invoice invoice = invoiceWithId(1L, 7L, "UNPAID");
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userServiceClient.getAccountById(5L, "true"))
                .thenReturn(new AccountInfo(5L, "MN0000000001", CurrencyType.MNT, BigDecimal.valueOf(100000)));
        when(appProperties.getInternalSecret()).thenReturn("secret");

        InvoiceResponse response = invoiceService.payInvoice(1L, 5L, 7L, "idem-key-1");

        assertThat(response.getStatus()).isEqualTo("PAID");
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void payInvoice_returnsExistingResultForRepeatedIdempotencyKey() {
        Invoice paidInvoice = invoiceWithId(1L, 7L, "PAID");
        Payment existingPayment = Payment.builder().invoice(paidInvoice).userId(7L).amount(BigDecimal.TEN).idempotencyKey("idem-key-1").build();
        when(paymentRepository.findByIdempotencyKey("idem-key-1")).thenReturn(Optional.of(existingPayment));

        InvoiceResponse response = invoiceService.payInvoice(1L, 5L, 7L, "idem-key-1");

        assertThat(response.getStatus()).isEqualTo("PAID");
        verify(invoiceRepository, never()).findById(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void payInvoice_throwsSecurityExceptionForOtherUser() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "UNPAID")));

        assertThatThrownBy(() -> invoiceService.payInvoice(1L, 5L, 999L, null))
                .isInstanceOf(SecurityException.class);

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void payInvoice_throwsIllegalStateWhenAlreadyPaid() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "PAID")));

        assertThatThrownBy(() -> invoiceService.payInvoice(1L, 5L, 7L, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cancelInvoice_marksUnpaidInvoiceCancelled() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "UNPAID")));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse response = invoiceService.cancelInvoice(1L);

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    void cancelInvoice_throwsIllegalStateWhenAlreadyPaid() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoiceWithId(1L, 7L, "PAID")));

        assertThatThrownBy(() -> invoiceService.cancelInvoice(1L))
                .isInstanceOf(IllegalStateException.class);

        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void sendUserInvoice_returnsExistingInvoiceForRepeatedIdempotencyKey() {
        Invoice existing = invoiceWithId(99L, 101L, "UNPAID");
        existing.setSenderId(7L);
        existing.setIdempotencyKey("send-key-1");
        when(invoiceRepository.findFirstBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(7L, "send-key-1"))
                .thenReturn(Optional.of(existing));

        InvoiceResponse response = invoiceService.sendUserInvoice(
                new com.anudari.payment_service.dto.SendInvoiceRequest(
                        "99112233",
                        BigDecimal.TEN,
                        "MNT",
                        "desc",
                        555L
                ),
                7L,
                "send-key-1"
        );

        assertThat(response.getId()).isEqualTo(99L);
        verify(invoiceRepository, never()).save(any(Invoice.class));
        verify(userServiceClient, never()).getUserByPhone(any(), any());
    }

    @Test
    void splitInvoice_splitsTotalAcrossReceiversAndSavesEachInvoice() {
        when(appProperties.getInternalSecret()).thenReturn("secret");
        when(userServiceClient.getUserByPhone("99110011", "secret"))
                .thenReturn(new UserIdResponse(101L, "u1", null, List.of("USER")));
        when(userServiceClient.getUserByPhone("99110022", "secret"))
                .thenReturn(new UserIdResponse(102L, "u2", null, List.of("USER")));
        when(userServiceClient.getUserByPhone("99110033", "secret"))
                .thenReturn(new UserIdResponse(103L, "u3", null, List.of("USER")));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<InvoiceResponse> responses = invoiceService.splitInvoice(
                new SendSplitInvoiceRequest(
                        List.of("99110011", "99110022", "99110033"),
                        new BigDecimal("10.00"),
                        "MNT",
                        "split",
                        555L
                ),
                7L,
                "split-key-1"
        );

        assertThat(responses).hasSize(3);
        assertThat(responses).extracting(InvoiceResponse::getAmount)
                .containsExactly(new BigDecimal("3.34"), new BigDecimal("3.33"), new BigDecimal("3.33"));
        verify(invoiceRepository, times(3)).save(any(Invoice.class));
    }

    @Test
    void splitInvoice_returnsExistingInvoicesForRepeatedIdempotencyKey() {
        Invoice existingA = invoiceWithId(11L, 1001L, "UNPAID");
        existingA.setSenderId(7L);
        existingA.setIdempotencyKey("split-key-1");
        existingA.setAmount(new BigDecimal("3.34"));

        Invoice existingB = invoiceWithId(12L, 1002L, "UNPAID");
        existingB.setSenderId(7L);
        existingB.setIdempotencyKey("split-key-1");
        existingB.setAmount(new BigDecimal("3.33"));

        when(invoiceRepository.findBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(7L, "split-key-1"))
                .thenReturn(List.of(existingA, existingB));

        List<InvoiceResponse> responses = invoiceService.splitInvoice(
                new SendSplitInvoiceRequest(
                        List.of("99110011", "99110022"),
                        new BigDecimal("6.67"),
                        "MNT",
                        "split",
                        555L
                ),
                7L,
                "split-key-1"
        );

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(InvoiceResponse::getId).containsExactly(11L, 12L);
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    private Invoice invoiceWithId(Long id, Long userId, String status) {
        InvoiceStatus invoiceStatus = switch (status) {
            case "PAID" -> new InvoiceStatus.Paid();
            case "CANCELLED" -> new InvoiceStatus.Cancelled();
            default -> new InvoiceStatus.Unpaid();
        };
        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + id)
                .userId(userId)
                .amount(BigDecimal.valueOf(20))
                .currency("MNT")
                .status(invoiceStatus)
                .build();
        invoice.setInvoiceId(id);
        invoice.getItems().add(InvoiceItem.builder()
                .invoice(invoice)
                .name("Widget")
                .qty(2)
                .unitPrice(BigDecimal.TEN)
                .lineTotal(BigDecimal.valueOf(20))
                .build());
        return invoice;
    }

    private FeignException.NotFound feignNotFound() {
        Request request = Request.create(Request.HttpMethod.GET, "/api/users/42",
                java.util.Map.of(), null, null, null);
        return new FeignException.NotFound("not found", request, null, null);
    }
}
