package com.anudari.payment_service.repository;

import com.anudari.payment_service.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserId(Long userId);
    List<Invoice> findBySenderId(Long senderId);
}