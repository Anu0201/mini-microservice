package com.anudari.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor //argument avdag constructoruudiig uusgene
public class AuthResponse {
    private String token;
    private String username;
    private List<String> roles;
}