package com.anudari.payment_service.repository;

import com.anudari.payment_service.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.userId = :userId AND p.paidAt >= :startOfDay")
    BigDecimal sumTodayByUserId(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);
}