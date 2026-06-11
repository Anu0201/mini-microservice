package com.anudari.auth_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserInternalDto {
    private Long id;
    private String username;
    private String credentialHash;
    private List<String> roles;
}