package com.anudari.user_service.repository;

import com.anudari.user_service.entity.AccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, Long> {

    List<AccountTransaction> findAllByAccount_AccountIdOrderByCreatedAtDesc(Long accountId);
}
