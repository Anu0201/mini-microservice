package com.anudari.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank //not null, hooson, space avaagui baihiig shalgaj baigaa
    private String username;

    @NotBlank
    private String password;
}
