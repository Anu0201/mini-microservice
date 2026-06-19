package com.anudari.admin.service;

import com.anudari.admin.dto.UserResponse;

import java.util.List;

public interface AdminUserService {
    List<UserResponse> listAllUsers();
}
