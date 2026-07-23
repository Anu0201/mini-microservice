package com.anudari.gateway_service.utility;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class MessageUtility {

    private static MessageSource messageSource;

    public static String getMessage(String code) {
        return getMessage(code, new Object[]{});
    }

    public static String getMessage(String code, Object[] args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(code, args, locale);
    }
}
