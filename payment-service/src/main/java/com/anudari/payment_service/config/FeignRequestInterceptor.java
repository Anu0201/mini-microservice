package com.anudari.payment_service.config;

import com.anudari.common.constant.AppConstants;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class FeignRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        String requestId = MDC.get(AppConstants.HEADER.REQUEST_ID);
        if (requestId != null) {
            template.header(AppConstants.HEADER.REQUEST_ID, requestId);
        }
    }
}