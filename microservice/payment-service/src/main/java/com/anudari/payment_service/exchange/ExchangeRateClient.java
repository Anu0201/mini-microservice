package com.anudari.payment_service.exchange;

import com.anudari.payment_service.config.AppProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class ExchangeRateClient {

    private static final String BASE_URL = "https://v6.exchangerate-api.com/v6";

    private final AppProperties appProperties;
    private final RestClient restClient = RestClient.create();

    public BigDecimal getConversionRate(String from, String to) {
        String apiKey = appProperties.getExchangeRateApiKey();
        RateResponse response = restClient.get()
                .uri(BASE_URL + "/" + apiKey + "/pair/" + from + "/" + to)
                .retrieve()
                .body(RateResponse.class);

        if (response == null || !"success".equals(response.result())) {
            throw new IllegalStateException("Failed to fetch exchange rate for " + from + " → " + to);
        }
        return response.conversionRate();
    }

    record RateResponse(String result, @JsonProperty("conversion_rate") BigDecimal conversionRate) {}
}
