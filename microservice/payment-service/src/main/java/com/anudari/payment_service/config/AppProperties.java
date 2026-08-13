package com.anudari.payment_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String internalSecret;
    private String exchangeRateApiKey;
    private BigDecimal dailyLimit = new BigDecimal("5000000");
}