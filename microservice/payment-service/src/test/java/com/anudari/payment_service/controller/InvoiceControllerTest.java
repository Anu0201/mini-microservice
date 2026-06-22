package com.anudari.payment_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.payment_service.config.SecurityConfig;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceItemRequest;
import com.anudari.payment_service.dto.InvoiceItemResponse;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.handler.GlobalExceptionHandler;
import com.anudari.payment_service.service.InvoiceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InvoiceController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = "app.internal-secret=test-secret")
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @MockitoBean
    private InvoiceService invoiceService;

    @Test
    void createInvoice_withValidSecret_returns201() throws Exception {
        when(invoiceService.createInvoice(any())).thenReturn(sampleInvoiceResponse());

        mockMvc.perform(post("/api/payments/invoices")
                        .header(AppConstants.HEADER.INTERNAL_SECRET, "test-secret")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleCreateRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("UNPAID"));
    }

    @Test
    void createInvoice_withoutSecret_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/invoices")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleCreateRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void createInvoice_withWrongSecret_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/invoices")
                        .header(AppConstants.HEADER.INTERNAL_SECRET, "not-the-secret")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleCreateRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void createInvoice_withNoItems_returns400() throws Exception {
        CreateInvoiceRequest invalid = new CreateInvoiceRequest(1L, "desc", null, null, List.of());

        mockMvc.perform(post("/api/payments/invoices")
                        .header(AppConstants.HEADER.INTERNAL_SECRET, "test-secret")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listAllInvoices_withValidSecret_returns200() throws Exception {
        when(invoiceService.listAllInvoices()).thenReturn(List.of(sampleInvoiceResponse()));

        mockMvc.perform(get("/api/payments/invoices")
                        .header(AppConstants.HEADER.INTERNAL_SECRET, "test-secret"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void listAllInvoices_withoutSecret_returns403() throws Exception {
        mockMvc.perform(get("/api/payments/invoices"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelInvoice_withValidSecret_returns200() throws Exception {
        when(invoiceService.cancelInvoice(1L)).thenReturn(sampleInvoiceResponse());

        mockMvc.perform(post("/api/payments/invoices/1/cancel")
                        .header(AppConstants.HEADER.INTERNAL_SECRET, "test-secret"))
                .andExpect(status().isOk());
    }

    @Test
    void cancelInvoice_withoutSecret_returns403() throws Exception {
        mockMvc.perform(post("/api/payments/invoices/1/cancel"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUserInvoices_withUserIdHeader_returns200() throws Exception {
        when(invoiceService.listUserInvoices(7L)).thenReturn(List.of(sampleInvoiceResponse()));

        mockMvc.perform(get("/api/payments/invoices/user")
                        .header(AppConstants.HEADER.AUTH_USER_ID, "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void listUserInvoices_withoutUserIdHeader_returns400() throws Exception {
        mockMvc.perform(get("/api/payments/invoices/user"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void payInvoice_passesUserIdAndIdempotencyKeyToService() throws Exception {
        when(invoiceService.payInvoice(1L, 7L, "idem-1")).thenReturn(sampleInvoiceResponse());

        mockMvc.perform(post("/api/payments/invoices/1/pay")
                        .header(AppConstants.HEADER.AUTH_USER_ID, "7")
                        .header(AppConstants.HEADER.IDEMPOTENCY_KEY, "idem-1"))
                .andExpect(status().isOk());

        verify(invoiceService).payInvoice(1L, 7L, "idem-1");
    }

    @Test
    void payInvoice_forbiddenForOtherUser_returns403() throws Exception {
        when(invoiceService.payInvoice(1L, 999L, null)).thenThrow(new SecurityException("Access denied"));

        mockMvc.perform(post("/api/payments/invoices/1/pay")
                        .header(AppConstants.HEADER.AUTH_USER_ID, "999"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getInvoiceById_withoutUserIdHeader_returns200() throws Exception {
        when(invoiceService.getInvoiceById(1L, null)).thenReturn(sampleInvoiceResponse());

        mockMvc.perform(get("/api/payments/invoices/1"))
                .andExpect(status().isOk());
    }

    @Test
    void getInvoiceById_notFound_returns404() throws Exception {
        when(invoiceService.getInvoiceById(99L, null)).thenThrow(new NoSuchElementException("Invoice not found: 99"));

        mockMvc.perform(get("/api/payments/invoices/99"))
                .andExpect(status().isNotFound());
    }

    private CreateInvoiceRequest sampleCreateRequest() {
        return new CreateInvoiceRequest(1L, "desc", LocalDate.now().plusDays(7), null,
                List.of(new InvoiceItemRequest("Widget", 2, BigDecimal.TEN)));
    }

    private InvoiceResponse sampleInvoiceResponse() {
        return new InvoiceResponse(1L, "INV-ABC123", 1L, BigDecimal.valueOf(20), "MNT", "UNPAID",
                "desc", LocalDate.now().plusDays(7),
                List.of(new InvoiceItemResponse(1L, "Widget", 2, BigDecimal.TEN, BigDecimal.valueOf(20))),
                LocalDateTime.now());
    }
}
