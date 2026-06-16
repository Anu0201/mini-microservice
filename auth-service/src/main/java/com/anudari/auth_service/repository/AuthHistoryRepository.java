package com.anudari.auth_service.repository;

import com.anudari.auth_service.entity.AuthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuthHistoryRepository extends JpaRepository<AuthHistory, Long> {
    List<AuthHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
