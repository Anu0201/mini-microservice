package com.anudari.auth_service.dto;

import lombok.Data;
import java.util.List;

//class dotorh buh talbart Getter, Setter, equals(), hashCode(), toString()
// methoduudiig tsaanaas n automataar uusgej ugjiga
@Data
public class UserInternalDto {
    private Long id;
    private String username;
    private String credentialHash;
    private List<String> roles;
}