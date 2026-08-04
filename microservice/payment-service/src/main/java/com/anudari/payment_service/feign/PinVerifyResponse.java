package com.anudari.payment_service.feign;

public record PinVerifyResponse(boolean valid, String reason) {
}
