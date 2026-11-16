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
public class AdminService {
    private final UserRepository users;
    private final CollegeRepository colleges;
    private final ListingRepository listingRepo;
    private final BookingRepository bookings;
    private final AdminActionRepository actions;
    private final BookingService bookingService;
    private final NotificationService notifier;

    @Transactional(readOnly = true)
    public Map<String, Object> stats() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("students", users.countByRole(User.Role.STUDENT));
        m.put("pendingVerifications", users.countByVerificationStatus(User.VerificationStatus.PENDING));
        m.put("listings", listingRepo.count());
        m.put("flaggedListings", listingRepo.countByFlaggedTrue());
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Booking.Status s : Booking.Status.values()) byStatus.put(s.name(), bookings.countByStatus(s));
        m.put("bookingsByStatus", byStatus);
        m.put("openDisputes", byStatus.get("DISPUTED"));
        m.put("settledRentVolume", bookings.sumRent(Booking.Status.SETTLED));
        m.put("platformFeesEarned", bookings.sumFees(Booking.Status.SETTLED));
        return m;
    }

    // ---------- users ----------
    @Transactional(readOnly = true)
    public PageDto<UserDto> users(User.VerificationStatus status, String q, int page, int size) {
        var p = users.search(status, q == null ? "" : q.trim(), org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                org.springframework.data.domain.Sort.by("id").descending()));
        return new PageDto<>(p.getContent().stream().map(UserDto::from).toList(), page, size, p.getTotalElements());
    }

    @Transactional
    public UserDto verifyUser(Long adminId, Long userId) {
        User u = user(userId);
        u.setVerificationStatus(User.VerificationStatus.VERIFIED);
        u.setVerifiedAt(LocalDateTime.now());
        log(adminId, "VERIFY_USER", "user", userId, null);
        notifier.notify(userId, "VERIFIED", "Your college verification was approved.", null);
        return UserDto.from(u);
    }

    @Transactional
    public UserDto rejectUser(Long adminId, Long userId, String reason) {
        User u = user(userId);
        u.setVerificationStatus(User.VerificationStatus.REJECTED);
        log(adminId, "REJECT_USER", "user", userId, reason);
        notifier.notify(userId, "VERIFICATION_REJECTED", "Your verification was rejected. " + (reason == null ? "" : reason), null);
        return UserDto.from(u);
    }

    @Transactional
    public UserDto suspend(Long adminId, Long userId, boolean suspended, String reason) {
        User u = user(userId);
        if (u.getRole() == User.Role.ADMIN) throw ApiException.badRequest("Admins can't be suspended");
        u.setSuspended(suspended);
        log(adminId, suspended ? "SUSPEND_USER" : "UNSUSPEND_USER", "user", userId, reason);
        return UserDto.from(u);
    }

    // ---------- listings ----------
    public PageDto<ListingDto> listings(boolean flaggedOnly, int page, int size) {
        var pr = org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        var p = flaggedOnly ? listingRepo.findByFlaggedTrue(pr) : listingRepo.findAll(pr);
        return new PageDto<>(p.getContent().stream().map(l -> ListingDto.from(l, OwnerSummary.from(user(l.getOwnerId())))).toList(), page, size, p.getTotalElements());
    }

    public void moderateListing(Long adminId, String listingId, String action, String reason) {
        Listing l = listingRepo.findById(listingId).orElseThrow(() -> ApiException.notFound("Listing not found"));
        switch (action) {
            case "flag" -> { l.setFlagged(true); l.setFlagReason(reason); }
            case "unflag" -> { l.setFlagged(false); l.setFlagReason(null); }
            case "archive" -> l.setStatus(Listing.Status.ARCHIVED);
            default -> throw ApiException.badRequest("Unknown action");
        }
        listingRepo.save(l);
        log(adminId, "LISTING_" + action.toUpperCase(), "listing", listingId, reason);
    }

    // ---------- colleges, disputes, audit ----------
    @Transactional
    public CollegeDto addCollege(CollegeRequest r) {
        String domain = r.emailDomain().trim().toLowerCase();
        if (colleges.existsByEmailDomain(domain)) throw ApiException.conflict("That domain is already registered");
        College c = new College();
        c.setName(r.name().trim());
        c.setEmailDomain(domain);
        c.setCampus(r.campus());
        return CollegeDto.from(colleges.save(c));
    }

    @Transactional(readOnly = true)
    public DisputeDetail dispute(Long bookingId) {
        Booking b = bookingService.load(bookingId);
        return new DisputeDetail(bookingService.toDto(b), bookingService.comparison(b.getOwner().getId(), bookingId),
                bookingService.photos(b.getOwner().getId(), bookingId));
    }

    @Transactional(readOnly = true)
    public List<ActionDto> actions() { return actions.findTop100ByOrderByIdDesc().stream().map(ActionDto::from).toList(); }

    private User user(Long id) { return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found")); }

    private void log(Long adminId, String type, String targetType, Object targetId, String notes) {
        AdminAction a = new AdminAction();
        a.setAdmin(users.getReferenceById(adminId));
        a.setActionType(type);
        a.setTargetType(targetType);
        a.setTargetId(String.valueOf(targetId));
        a.setNotes(notes);
        actions.save(a);
    }
}
