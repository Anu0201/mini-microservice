package com.anudari.user_service.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class InternalPinVerifyRequest {

    private Long userId;
    private String pin;

    public InternalPinVerifyRequest() {
    }

}