package com.anudari.user_service.controller;

import com.anudari.common.constant.AppConstants;
import com.anudari.user_service.config.AppProperties;
import com.anudari.user_service.dto.CheckPinRequest;
import com.anudari.user_service.dto.CreatePinRequest;
import com.anudari.user_service.dto.InternalPinVerifyRequest;
import com.anudari.user_service.dto.PinVerificationResponse;
import com.anudari.common.exception.BusinessException;
import com.anudari.user_service.service.PinService;
import com.anudari.user_service.util.MessageUtility;
import com.anudari.user_service.dto.SuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/pin")
@RequiredArgsConstructor
public class PinController {

    private final PinService pinService;
    private final MessageUtility messageUtility;
    private final AppProperties appProperties;

    @PostMapping("create")
    public ResponseEntity<?> createPin(@Valid @RequestBody CreatePinRequest dto) {
        pinService.createPin(dto);
        return ResponseEntity.ok(new SuccessResponse(messageUtility.getMessage("response.success")));
    }

    @PostMapping("check")
    public ResponseEntity<?> checkPin(@Valid @RequestBody CheckPinRequest dto) {
        PinVerificationResponse result = pinService.checkPin(dto);
        return ResponseEntity.ok(result);
    }

    @PostMapping("recover")
    public ResponseEntity<?> recoverPin(@Valid @RequestBody CreatePinRequest dto) {
        pinService.recoverPin(dto);
        return ResponseEntity.ok(new SuccessResponse(messageUtility.getMessage("response.success")));
    }

    @PostMapping("change")
    public ResponseEntity<?> changePin(@Valid @RequestBody CreatePinRequest dto) {
        pinService.changePin(dto);
        return ResponseEntity.ok(new SuccessResponse(messageUtility.getMessage("response.success")));
    }

    @PostMapping("internal/verify")
    public ResponseEntity<PinVerificationResponse> verifyPinInternal(
            @RequestBody InternalPinVerifyRequest dto,
            @RequestHeader(value = AppConstants.HEADER.INTERNAL_SECRET, required = false) String secretToken) {
        if (secretToken == null || !secretToken.equals(appProperties.getInternalSecret())) {
            throw new SecurityException(messageUtility.getMessage("access.denied"));
        }
        return ResponseEntity.ok(pinService.verifyPinInternal(dto.getUserId(), dto.getPin()));
    }
}