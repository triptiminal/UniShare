package com.campusrent.backend.controller;

import com.campusrent.backend.common.CurrentUser;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService payments;
    private final BookingService bookings;
    private final TransactionService transactions;

    /** Called by the browser after Razorpay Checkout succeeds. */
    @PostMapping("/payments/verify")
    public BookingDto verify(@Valid @RequestBody VerifyPaymentRequest r) {
        Long uid = CurrentUser.id();
        return bookings.get(uid, payments.verify(uid, r));
    }

    /** Public endpoint, authenticated by the Razorpay HMAC signature instead of a JWT. */
    @PostMapping("/payments/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String raw, @RequestHeader(value = "X-Razorpay-Signature", required = false) String sig) {
        payments.handleWebhook(raw, sig);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/transactions")
    public List<TransactionDto> transactions(@RequestParam(required = false) String kind) { return transactions.mine(CurrentUser.id(), kind); }
}
