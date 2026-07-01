package com.anudari.auth_service.handler;

import com.anudari.common.constant.AppConstants;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.slf4j.MDC;

public class FeignRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        String requestId = MDC.get(AppConstants.HEADER.REQUEST_ID);
        if (requestId != null) {
            template.header(AppConstants.HEADER.REQUEST_ID, requestId);
        }
    }
}
