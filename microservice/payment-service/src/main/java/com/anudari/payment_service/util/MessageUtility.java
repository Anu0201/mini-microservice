package com.anudari.payment_service.util;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class MessageUtility {

    private static MessageSource messageSource;

    public MessageUtility(MessageSource ms) {
        MessageUtility.messageSource = ms;
    }

    public static String getMessage(String code) {
        return getMessage(code, new Object[]{});
    }

    public static String getMessage(String code, Object[] args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(code, args, locale);
    }
}