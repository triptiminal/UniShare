package com.campusrent.backend.service;

import com.campusrent.backend.common.*;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final PaymentRepository payments;
    private final RefundRepository refunds;
    private final BookingRepository bookings;
    private final DepositSettlementRepository settlements;

    /** Read-only ledger built from payments, refunds and settled bookings (there is no stored wallet balance). */
    @Transactional(readOnly = true)
    public List<TransactionDto> mine(Long userId, String kind) {
        List<TransactionDto> out = new ArrayList<>();
        payments.findByBooking_Renter_IdAndStatusIn(userId, List.of(Payment.Status.CAPTURED, Payment.Status.PARTIALLY_REFUNDED, Payment.Status.REFUNDED))
                .forEach(p -> out.add(new TransactionDto(p.getBooking().getPaidAt() != null ? p.getBooking().getPaidAt() : p.getUpdatedAt(),
                        "PAYMENT", "Payment (rent + fee + deposit) - " + p.getBooking().getCode(), p.getAmount().negate(), p.getBooking().getCode())));
        refunds.findByPayment_Booking_Renter_Id(userId)
                .forEach(r -> out.add(new TransactionDto(r.getCreatedAt(), "REFUND", "Deposit refund - " + r.getPayment().getBooking().getCode(),
                        r.getAmount(), r.getPayment().getBooking().getCode())));
        for (Booking b : bookings.findByOwner_IdAndStatus(userId, Booking.Status.SETTLED)) {
            BigDecimal deduction = settlements.findByBooking_Id(b.getId()).map(DepositSettlement::getResolvedAmount).orElse(BigDecimal.ZERO);
            if (deduction == null) deduction = BigDecimal.ZERO;
            BigDecimal earned = b.getRentalPrice().subtract(b.getPlatformFee()).add(deduction);
            out.add(new TransactionDto(b.getSettledAt(), "EARNING", "Rental earnings - " + b.getCode(), earned, b.getCode()));
        }
        out.sort(Comparator.comparing(TransactionDto::date, Comparator.nullsLast(Comparator.reverseOrder())));
        if (kind == null || kind.isBlank() || kind.equalsIgnoreCase("all")) return out;
        return out.stream().filter(t -> t.kind().equalsIgnoreCase(kind)).toList();
    }
}
