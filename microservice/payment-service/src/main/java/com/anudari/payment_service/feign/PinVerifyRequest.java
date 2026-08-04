package com.anudari.payment_service.feign;

public record PinVerifyRequest(Long userId, String pin) {
}
