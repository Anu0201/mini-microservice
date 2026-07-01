package com.anudari.auth_service.service;

import com.anudari.auth_service.entity.AuthHistory;
import com.anudari.auth_service.repository.AuthHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AsyncHistoryService {

    private final AuthHistoryRepository authHistoryRepository;

    @Async("asyncExecutor")
    public void save(Long userId, String username, String eventType, String ipAddress, String userAgent) {
        authHistoryRepository.save(AuthHistory.builder()
                .userId(userId)
                .username(username)
                .eventType(eventType)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());
    }
}