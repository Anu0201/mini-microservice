package com.anudari.payment_service.feign;

import java.util.List;

public record UserIdResponse(Long userId, String username, String credentialHash, List<String> roles) {}
