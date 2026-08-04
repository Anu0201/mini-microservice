package com.anudari.user_service.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class PinVerificationResponse {

    private boolean valid;
    private String reason;

    public PinVerificationResponse() {
    }

    public PinVerificationResponse(boolean valid, String reason) {
        this.valid = valid;
        this.reason = reason;
    }

}