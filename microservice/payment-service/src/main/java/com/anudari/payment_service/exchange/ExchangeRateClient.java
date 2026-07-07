package com.anudari.payment_service.exchange;

import com.anudari.payment_service.config.AppProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateClient {

    private static final String BASE_URL = "https://v6.exchangerate-api.com/v6";
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS    = 10_000;

    private final AppProperties appProperties;
    private final RestClient restClient = buildRestClient();

    public BigDecimal getConversionRate(String from, String to) {
        String url = BASE_URL + "/" + appProperties.getExchangeRateApiKey() + "/pair/" + from + "/" + to;
        log.info("[ExchangeRateClient][GET][{} -> {}][INI]", from, to);
        try {
            RateResponse response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(RateResponse.class);

            if (response == null || !"success".equals(response.result())) {
                throw new IllegalStateException("Exchange rate API returned failure for " + from + " → " + to);
            }

            log.info("[ExchangeRateClient][GET][{} -> {}][rate={}][END]", from, to, response.conversionRate());
            return response.conversionRate();

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("[ExchangeRateClient][GET][{} -> {}][ERROR][{}]", from, to, e.getMessage());
            throw new IllegalStateException("Exchange rate service unavailable: " + e.getMessage(), e);
        }
    }

    private static RestClient buildRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().requestFactory(factory).build();
    }

    record RateResponse(String result, @JsonProperty("conversion_rate") BigDecimal conversionRate) {}
}
