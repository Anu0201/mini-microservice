package com.anudari.payment_service;

import com.anudari.payment_service.exchange.ExchangeRateClient;
import com.anudari.payment_service.feign.UserServiceClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = "app.internal-secret=test-secret")
class PaymentServiceApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @MockitoBean
    private UserServiceClient userServiceClient;

    @MockitoBean
    private ExchangeRateClient exchangeRateClient;

    @Test
    void contextLoads() {
    }

}
