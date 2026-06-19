package com.anudari.admin.serviceImpl;

import com.anudari.admin.dto.AdminLoginRequest;
import com.anudari.admin.dto.AdminLoginResponse;
import com.anudari.admin.entity.Admin;
import com.anudari.admin.exception.AuthenticationException;
import com.anudari.admin.repository.AdminRepository;
import com.anudari.admin.service.AdminAuthService;
import com.anudari.admin.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AdminLoginResponse login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new AuthenticationException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(admin.getId(), admin.getUsername());
        return new AdminLoginResponse(token, admin.getUsername());
    }
}
