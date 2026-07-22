package com.anudari.payment_service.repository;

import com.anudari.payment_service.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.items WHERE i.userId = :userId")
    List<Invoice> findByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.items WHERE i.senderId = :senderId")
    List<Invoice> findBySenderId(@Param("senderId") Long senderId);

    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.items")
    List<Invoice> findAllWithItems();

    Optional<Invoice> findFirstBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(Long senderId, String idempotencyKey);

    List<Invoice> findBySenderIdAndIdempotencyKeyOrderByInvoiceIdAsc(Long senderId, String idempotencyKey);
}