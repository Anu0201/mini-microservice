package com.anudari.user_service.dto;

import com.anudari.common.constant.CurrencyType;
import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(@NotNull(message = "Currency is required") CurrencyType currency) {
}
