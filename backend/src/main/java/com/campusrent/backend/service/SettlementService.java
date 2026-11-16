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
public class SettlementService {
    private final BookingService bookingService;
    private final DepositSettlementRepository settlements;
    private final ConditionPhotoRepository photos;
    private final PaymentService payments;
    private final ListingService listings;
    private final NotificationService notifier;
    private final UserRepository users;
    private final AdminActionRepository actions;

    /** Owner confirms no damage: full deposit goes back to the renter. */
    @Transactional
    public BookingDto release(Long ownerId, Long bookingId) {
        Booking b = bookingService.load(bookingId);
        ownerOnly(b, ownerId);
        expect(b, Booking.Status.RETURNED);
        DepositSettlement s = new DepositSettlement();
        s.setBooking(b);
        s.setRenterResponse(DepositSettlement.RenterResponse.ACCEPTED);
        settlements.save(s);
        settle(b, s, BigDecimal.ZERO);
        return bookingService.toDto(b);
    }

    /** Owner claims a deduction, backed by evidence photos from this booking. */
    @Transactional
    public BookingDto claim(Long ownerId, Long bookingId, ClaimRequest r) {
        Booking b = bookingService.load(bookingId);
        ownerOnly(b, ownerId);
        expect(b, Booking.Status.RETURNED);
        if (r.amount().compareTo(b.getDepositAmount()) > 0) throw ApiException.badRequest("Claim can't exceed the deposit (" + b.getDepositAmount() + ")");
        List<Long> evidence = r.evidencePhotoIds() == null ? List.of() : r.evidencePhotoIds();
        Set<Long> valid = new HashSet<>();
        photos.findByBooking_IdOrderByIdAsc(bookingId).forEach(p -> valid.add(p.getId()));
        if (!valid.containsAll(evidence)) throw ApiException.badRequest("Evidence must be photos from this booking");
        DepositSettlement s = new DepositSettlement();
        s.setBooking(b);
        s.setDeductedAmount(r.amount());
        s.setDeductionReason(r.reason());
        s.setEvidencePhotoIds(new ArrayList<>(evidence));
        settlements.save(s);
        b.setStatus(Booking.Status.UNDER_REVIEW);
        notifier.notify(b.getRenter().getId(), "DAMAGE_CLAIM", "The owner claimed ₹" + r.amount() + " from your deposit for " + b.getListingTitle() + ".", b.getId());
        return bookingService.toDto(b);
    }

    /** Renter accepts (deduction applied, rest refunded) or disputes (goes to an admin). */
    @Transactional
    public BookingDto respond(Long renterId, Long bookingId, RespondRequest r) {
        Booking b = bookingService.load(bookingId);
        if (!b.getRenter().getId().equals(renterId)) throw ApiException.forbidden("Only the renter can respond to a claim");
        expect(b, Booking.Status.UNDER_REVIEW);
        DepositSettlement s = settlements.findByBooking_Id(bookingId).orElseThrow(() -> ApiException.notFound("No claim found"));
        if (r.accept()) {
            s.setRenterResponse(DepositSettlement.RenterResponse.ACCEPTED);
            b.setStatus(Booking.Status.DEDUCTION_ACCEPTED);
            settle(b, s, s.getDeductedAmount());
        } else {
            s.setRenterResponse(DepositSettlement.RenterResponse.DISPUTED);
            s.setDisputeReason(r.reason());
            b.setStatus(Booking.Status.DISPUTED);
            notifier.notify(b.getOwner().getId(), "CLAIM_DISPUTED", "The renter disputed your claim on " + b.getListingTitle() + ". An admin will review it.", b.getId());
            notifier.notifyAdmins("DISPUTE_OPENED", "New dispute on booking " + b.getCode(), b.getId());
        }
        return bookingService.toDto(b);
    }

    /** Admin arbitration: approve the claim, adjust the amount, or reject it and refund in full. */
    @Transactional
    public BookingDto resolve(Long adminId, Long bookingId, ResolveRequest r) {
        Booking b = bookingService.load(bookingId);
        expect(b, Booking.Status.DISPUTED);
        DepositSettlement s = settlements.findByBooking_Id(bookingId).orElseThrow(() -> ApiException.notFound("No dispute found"));
        BigDecimal deduction = switch (r.resolution()) {
            case APPROVED -> s.getDeductedAmount();
            case REJECTED -> BigDecimal.ZERO;
            case ADJUSTED -> {
                if (r.amount() == null || r.amount().signum() < 0 || r.amount().compareTo(b.getDepositAmount()) > 0)
                    throw ApiException.badRequest("Adjusted amount must be between 0 and the deposit");
                yield r.amount();
            }
            case NONE -> throw ApiException.badRequest("Choose APPROVED, ADJUSTED or REJECTED");
        };
        s.setAdminResolution(r.resolution());
        s.setAdminNotes(r.notes());
        s.setResolvedBy(users.getReferenceById(adminId));
        AdminAction a = new AdminAction();
        a.setAdmin(users.getReferenceById(adminId));
        a.setActionType("RESOLVE_DISPUTE");
        a.setTargetType("booking");
        a.setTargetId(String.valueOf(bookingId));
        a.setNotes(r.resolution() + " ₹" + deduction + (r.notes() == null ? "" : " - " + r.notes()));
        actions.save(a);
        settle(b, s, deduction);
        return bookingService.toDto(b);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> openDisputes() {
        return bookingService.disputes();
    }

    /** Applies the final deduction, refunds the rest of the deposit via Razorpay, and closes the booking. */
    private void settle(Booking b, DepositSettlement s, BigDecimal deduction) {
        BigDecimal refund = b.getDepositAmount().subtract(deduction);
        payments.refundDeposit(b, refund, deduction.signum() == 0 ? "Deposit released in full" : "Deposit refund after deduction");
        s.setResolvedAmount(deduction);
        s.setResolvedAt(LocalDateTime.now());
        b.setStatus(Booking.Status.SETTLED);
        b.setSettledAt(LocalDateTime.now());
        listings.unblock(b.getListingId(), b.getId());
        String msg = "Booking " + b.getCode() + " is settled. Deposit refund: ₹" + refund + ".";
        notifier.notify(b.getRenter().getId(), "SETTLED", msg, b.getId());
        notifier.notify(b.getOwner().getId(), "SETTLED", "Booking " + b.getCode() + " is settled." + (deduction.signum() > 0 ? " You received ₹" + deduction + " from the deposit." : ""), b.getId());
    }

    private void ownerOnly(Booking b, Long userId) { if (!b.getOwner().getId().equals(userId)) throw ApiException.forbidden("Only the owner can do this"); }
    private void expect(Booking b, Booking.Status st) { if (b.getStatus() != st) throw ApiException.conflict("Booking is " + b.getStatus() + ", expected " + st); }
}
