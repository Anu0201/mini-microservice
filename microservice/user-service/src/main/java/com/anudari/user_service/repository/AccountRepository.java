package com.anudari.user_service.repository;

import com.anudari.common.constant.CurrencyType;
import com.anudari.user_service.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    List<Account> findAllByUser_UserId(Long userId);

    boolean existsByUser_UserIdAndCurrency(Long userId, CurrencyType currency);

    Optional<Account> findByAccountNumber(String accountNumber);

    Optional<Account> findByUser_UserIdAndCurrency(Long userId, CurrencyType currency);
}
