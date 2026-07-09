package com.anudari.auth_service.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String phone, @NotBlank String password) {}