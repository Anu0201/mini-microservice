package com.anudari.payment_service;

import com.anudari.common.constant.AppConstants;
import com.anudari.payment_service.dto.CreateInvoiceRequest;
import com.anudari.payment_service.dto.InvoiceItemRequest;
import com.anudari.payment_service.dto.InvoiceResponse;
import com.anudari.payment_service.feign.UserServiceClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
class InvoicePaymentIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @MockitoBean
    private UserServiceClient userServiceClient;

    @Test
    void fullInvoiceLifecycle_createListPayCancel() {
        when(userServiceClient.getUserById(anyLong(), any()))
                .thenReturn(new com.anudari.payment_service.feign.UserIdResponse(501L, "testuser", "hash", List.of("ROLE_USER")));

        Long userId = 501L;

        InvoiceResponse created = createInvoice(userId);
        assertThat(created.getStatus()).isEqualTo("UNPAID");
        assertThat(created.getAmount()).isEqualByComparingTo("20");

        ResponseEntity<InvoiceResponse[]> userInvoices = restTemplate.exchange(
                "/api/payments/invoices/user", org.springframework.http.HttpMethod.GET,
                new HttpEntity<>(headersWithUserId(userId)), InvoiceResponse[].class);
        assertThat(userInvoices.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(userInvoices.getBody()).extracting(InvoiceResponse::getId).contains(created.getId());

        ResponseEntity<InvoiceResponse> paid = restTemplate.exchange(
                "/api/payments/invoices/" + created.getId() + "/pay", org.springframework.http.HttpMethod.POST,
                new HttpEntity<>(headersWithUserId(userId)), InvoiceResponse.class);
        assertThat(paid.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(paid.getBody().getStatus()).isEqualTo("PAID");

        ResponseEntity<InvoiceResponse> fetched = restTemplate.getForEntity(
                "/api/payments/invoices/" + created.getId(), InvoiceResponse.class);
        assertThat(fetched.getBody().getStatus()).isEqualTo("PAID");

        ResponseEntity<String> cancelPaidAttempt = restTemplate.exchange(
                "/api/payments/invoices/" + created.getId() + "/cancel", org.springframework.http.HttpMethod.POST,
                new HttpEntity<>(internalSecretHeaders()), String.class);
        assertThat(cancelPaidAttempt.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        InvoiceResponse second = createInvoice(userId);
        ResponseEntity<InvoiceResponse> cancelled = restTemplate.exchange(
                "/api/payments/invoices/" + second.getId() + "/cancel", org.springframework.http.HttpMethod.POST,
                new HttpEntity<>(internalSecretHeaders()), InvoiceResponse.class);
        assertThat(cancelled.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cancelled.getBody().getStatus()).isEqualTo("CANCELLED");
    }

    private InvoiceResponse createInvoice(Long userId) {
        CreateInvoiceRequest request = new CreateInvoiceRequest(userId, "integration test invoice", null, null,
                List.of(new InvoiceItemRequest("Widget", 2, BigDecimal.TEN)));
        ResponseEntity<InvoiceResponse> response = restTemplate.postForEntity(
                "/api/payments/invoices", new HttpEntity<>(request, internalSecretHeaders()), InvoiceResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private HttpHeaders internalSecretHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(AppConstants.HEADER.INTERNAL_SECRET, "my-super-shared-secret-key-123");
        return headers;
    }

    private HttpHeaders headersWithUserId(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(AppConstants.HEADER.AUTH_USER_ID, String.valueOf(userId));
        return headers;
    }
}
