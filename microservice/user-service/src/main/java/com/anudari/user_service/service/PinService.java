package com.anudari.user_service.service;

import com.anudari.user_service.dto.CheckPinRequest;
import com.anudari.user_service.dto.CreatePinRequest;
import com.anudari.user_service.dto.PinVerificationResponse;
import com.anudari.user_service.entity.User;
import com.anudari.common.exception.BusinessException;
import com.anudari.user_service.repository.UserRepository;
import com.anudari.user_service.security.CurrentUserProvider;
import com.anudari.user_service.util.MessageUtility;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PinService {

    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{4}$");
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageUtility messageUtility;
    private final CurrentUserProvider currentUserProvider;

    public void createPin(CreatePinRequest dto) {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUserOrThrow(userId);

        if (user.getPinHash() != null) {
            throw new BusinessException(messageUtility.getMessage("pin.already.exists"));
        }

        user.setPinHash(passwordEncoder.encode(dto.getPin()));
        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }

    public PinVerificationResponse checkPin(CheckPinRequest dto) {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUserOrThrow(userId);

        PinVerificationResponse result = verifyAndTrack(user, dto.getPin());
        if (!result.isValid()) {
            if ("LOCKED".equals(result.getReason())) {
                throw new BusinessException(messageUtility.getMessage("pin.locked"));
            }
            throw new BusinessException(messageUtility.getMessage("pin.invalid"));
        }
        return result;
    }

    public void recoverPin(CreatePinRequest dto) {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUserOrThrow(userId);

        user.setPinHash(passwordEncoder.encode(dto.getPin()));
        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }

    public void changePin(CreatePinRequest dto) {
        Long userId = currentUserProvider.getCurrentUserId();
        User user = getUserOrThrow(userId);

        if (user.getPinHash() == null) {
            throw new BusinessException(messageUtility.getMessage("pin.not.set"));
        }

        user.setPinHash(passwordEncoder.encode(dto.getPin()));
        user.setPinFailedAttempts(0);
        user.setPinLockedUntil(null);
        userRepository.save(user);
    }

    public PinVerificationResponse verifyPinInternal(Long userId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return verifyAndTrack(user, pin);
    }
    
    private PinVerificationResponse verifyAndTrack(User user, String pin) {
        if (pin == null || !PIN_PATTERN.matcher(pin).matches()) {
            return new PinVerificationResponse(false, "INVALID");
        }

        if (user.getPinLockedUntil() != null && user.getPinLockedUntil().isAfter(Instant.now())) {
            return new PinVerificationResponse(false, "LOCKED");
        }

        boolean matches = user.getPinHash() != null
                && passwordEncoder.matches(pin, user.getPinHash());

        if (!matches) {
            registerFailedAttempt(user);
            return new PinVerificationResponse(false, "INVALID");
        }

        if (user.getPinFailedAttempts() != 0) {
            user.setPinFailedAttempts(0);
            userRepository.save(user);
        }
        return new PinVerificationResponse(true, null);
    }

    private void registerFailedAttempt(User user) {
        int attempts = user.getPinFailedAttempts() + 1;
        if (attempts >= MAX_ATTEMPTS) {
            user.setPinLockedUntil(Instant.now().plus(LOCK_DURATION));
            user.setPinFailedAttempts(0);
        } else {
            user.setPinFailedAttempts(attempts);
        }
        userRepository.save(user);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "User not found: " + userId)); // TODO: BusinessException рүү checked-safe хөрвүүлэх
    }
}