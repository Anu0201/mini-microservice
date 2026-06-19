package com.anudari.admin.service;

import com.anudari.admin.dto.AdminLoginRequest;
import com.anudari.admin.dto.AdminLoginResponse;

public interface AdminAuthService {
    AdminLoginResponse login(AdminLoginRequest request);
}
