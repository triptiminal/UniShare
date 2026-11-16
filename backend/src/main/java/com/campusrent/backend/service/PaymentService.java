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
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository payments;
    private final RefundRepository refunds;
    private final BookingRepository bookings;
    private final com.campusrent.backend.integration.RazorpayClient razorpay;
    private final NotificationService notifier;

    /** Step 1: create a Razorpay order for rent + platform fee + refundable deposit. */
    @Transactional
    public PayInit initiate(Long renterId, Long bookingId) {
        Booking b = bookings.findById(bookingId).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!b.getRenter().getId().equals(renterId)) throw ApiException.forbidden("Only the renter can pay");
        if (b.getStatus() != Booking.Status.ACCEPTED) throw ApiException.conflict("Booking isn't awaiting payment");
        long paise = toPaise(b.total());
        Map<String, Object> order = razorpay.createOrder(paise, b.getCode(), Map.of("bookingId", String.valueOf(b.getId())));
        Payment p = new Payment();
        p.setBooking(b);
        p.setRazorpayOrderId(String.valueOf(order.get("id")));
        p.setAmount(b.total());
        p.setRentAmount(b.getRentalPrice());
        p.setPlatformFee(b.getPlatformFee());
        p.setDepositAmount(b.getDepositAmount());
        payments.save(p);
        return new PayInit(b.getId(), p.getRazorpayOrderId(), paise, "INR", razorpay.getKeyId());
    }

    /** Step 2: verify the signature Razorpay Checkout returns to the browser (server-side, never trusted from the client). */
    @Transactional
    public Long verify(Long renterId, VerifyPaymentRequest r) {
        Payment p = payments.findByRazorpayOrderId(r.razorpayOrderId()).orElseThrow(() -> ApiException.notFound("Unknown order"));
        if (!p.getBooking().getRenter().getId().equals(renterId)) throw ApiException.forbidden("Not your payment");
        if (!razorpay.verifyCheckout(r.razorpayOrderId(), r.razorpayPaymentId(), r.razorpaySignature()))
            throw ApiException.badRequest("Payment signature verification failed");
        markPaid(p, r.razorpayPaymentId(), r.razorpaySignature());
        return p.getBooking().getId();
    }

    /** Step 3 (safety net): Razorpay webhooks update state even if the browser never returns. */
    @Transactional
    public void handleWebhook(String raw, String signature) {
        if (!razorpay.verifyWebhook(raw, signature)) throw ApiException.badRequest("Invalid webhook signature");
        Map<String, Object> root = org.springframework.boot.json.JsonParserFactory.getJsonParser().parseMap(raw);
        String event = String.valueOf(root.get("event"));
        Map<String, Object> payload = map(root.get("payload"));
        switch (event) {
            case "payment.captured" -> {
                Map<String, Object> e = entity(payload, "payment");
                payments.findByRazorpayOrderId(String.valueOf(e.get("order_id"))).ifPresent(p -> markPaid(p, String.valueOf(e.get("id")), null));
            }
            case "payment.failed" -> {
                Map<String, Object> e = entity(payload, "payment");
                payments.findByRazorpayOrderId(String.valueOf(e.get("order_id"))).ifPresent(p -> {
                    if (p.getStatus() == Payment.Status.CREATED) p.setStatus(Payment.Status.FAILED);
                });
            }
            case "refund.processed", "refund.failed" -> {
                Map<String, Object> e = entity(payload, "refund");
                refunds.findByRazorpayRefundId(String.valueOf(e.get("id")))
                        .ifPresent(rf -> rf.setStatus(event.endsWith("processed") ? Refund.Status.PROCESSED : Refund.Status.FAILED));
            }
            default -> { /* ignore other events */ }
        }
    }

    /** Refund part of the held deposit through Razorpay. Throws (and rolls back the settlement) if Razorpay rejects it. */
    @Transactional
    public void refundDeposit(Booking b, BigDecimal amount, String reason) {
        if (amount.signum() <= 0) return;
        Payment p = payments.findFirstByBooking_IdAndStatusInOrderByIdDesc(b.getId(),
                List.of(Payment.Status.CAPTURED, Payment.Status.PARTIALLY_REFUNDED))
                .orElseThrow(() -> ApiException.conflict("No captured payment found for this booking"));
        Map<String, Object> res = razorpay.refund(p.getRazorpayPaymentId(), toPaise(amount), Map.of("reason", reason, "booking", b.getCode()));
        Refund rf = new Refund();
        rf.setPayment(p);
        rf.setAmount(amount);
        rf.setReason(reason);
        rf.setRazorpayRefundId(String.valueOf(res.get("id")));
        rf.setStatus("processed".equals(res.get("status")) ? Refund.Status.PROCESSED : Refund.Status.INITIATED);
        refunds.save(rf);
        p.setStatus(Payment.Status.PARTIALLY_REFUNDED);
    }

    private void markPaid(Payment p, String paymentId, String signature) {
        if (p.getStatus() == Payment.Status.CAPTURED) return; // idempotent (browser callback + webhook both arrive)
        p.setRazorpayPaymentId(paymentId);
        if (signature != null) p.setRazorpaySignature(signature);
        p.setStatus(Payment.Status.CAPTURED);
        Booking b = p.getBooking();
        if (b.getStatus() == Booking.Status.ACCEPTED) {
            b.setStatus(Booking.Status.PAID);
            b.setPaidAt(LocalDateTime.now());
            notifier.notify(b.getRenter().getId(), "PAYMENT_CAPTURED", "Payment received for " + b.getListingTitle() + ".", b.getId());
            notifier.notify(b.getOwner().getId(), "BOOKING_PAID", b.getRenter().getName() + " paid for " + b.getListingTitle() + ". Arrange the handover.", b.getId());
        }
    }

    private static long toPaise(BigDecimal rupees) { return rupees.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact(); }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object o) { return o instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of(); }
    private static Map<String, Object> entity(Map<String, Object> payload, String key) { return map(map(payload.get(key)).get("entity")); }
}
