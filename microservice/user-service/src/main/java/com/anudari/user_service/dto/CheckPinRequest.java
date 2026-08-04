package com.anudari.user_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CheckPinRequest {

    @NotBlank
    private String pin;

}
