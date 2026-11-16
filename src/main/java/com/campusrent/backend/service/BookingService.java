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
public class BookingService {
    private final BookingRepository bookings;
    private final ConditionPhotoRepository photos;
    private final DepositSettlementRepository settlements;
    private final ListingService listings;
    private final UserService users;
    private final NotificationService notifier;
    private final UploadService uploads;

    @Value("${app.platform-fee-percent}")
    private BigDecimal feePercent;

    // ---------- request / accept / decline / cancel ----------
    @Transactional
    public BookingDto request(Long renterId, BookingRequest r) {
        User renter = users.requireVerified(renterId);
        Listing l = listings.getActive(r.listingId());
        if (l.getOwnerId().equals(renterId)) throw ApiException.badRequest("You can't rent your own item");
        LocalDate s = r.startDate(), e = r.endDate();
        if (!e.isAfter(s) || s.isBefore(LocalDate.now())) throw ApiException.badRequest("Choose future dates with the end after the start");
        if (bookings.countOverlap(l.getId(), Booking.BLOCKING, s, e) > 0) throw ApiException.conflict("The item isn't available for those dates");

        long days = java.time.temporal.ChronoUnit.DAYS.between(s, e);
        BigDecimal rent = BigDecimal.valueOf(l.getPricePerDay()).multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP);
        Booking b = new Booking();
        b.setListingId(l.getId());
        b.setListingTitle(l.getTitle());
        b.setListingPhoto(l.getPhotos().isEmpty() ? null : l.getPhotos().get(0));
        b.setOwner(users.get(l.getOwnerId()));
        b.setRenter(renter);
        b.setStartDate(s);
        b.setEndDate(e);
        b.setRentalPrice(rent);
        b.setPlatformFee(rent.multiply(feePercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        b.setDepositAmount(BigDecimal.valueOf(l.getDepositAmount()).setScale(2, RoundingMode.HALF_UP));
        b = bookings.save(b);
        b.setCode("CR-" + (30000 + b.getId()));
        notifier.notify(l.getOwnerId(), "BOOKING_REQUEST", renter.getName() + " wants to rent " + l.getTitle(), b.getId());
        return toDto(b);
    }

    @Transactional
    public BookingDto accept(Long ownerId, Long id) {
        Booking b = asOwner(ownerId, id);
        require(b, Booking.Status.REQUESTED);
        if (bookings.countOverlap(b.getListingId(), Booking.BLOCKING, b.getStartDate(), b.getEndDate()) > 0)
            throw ApiException.conflict("Those dates were taken by another booking");
        b.setStatus(Booking.Status.ACCEPTED);
        b.setAcceptedAt(LocalDateTime.now());
        listings.block(b.getListingId(), b.getId(), b.getStartDate(), b.getEndDate());
        notifier.notify(b.getRenter().getId(), "BOOKING_ACCEPTED", "Your request for " + b.getListingTitle() + " was accepted. Pay to confirm.", b.getId());
        return toDto(b);
    }

    @Transactional
    public BookingDto decline(Long ownerId, Long id, String reason) {
        Booking b = asOwner(ownerId, id);
        require(b, Booking.Status.REQUESTED);
        b.setStatus(Booking.Status.DECLINED);
        b.setDeclinedAt(LocalDateTime.now());
        b.setDeclineReason(reason);
        notifier.notify(b.getRenter().getId(), "BOOKING_DECLINED", "Your request for " + b.getListingTitle() + " was declined.", b.getId());
        return toDto(b);
    }

    /** Either party may cancel before payment. Cancelling after payment goes through a dispute/admin. */
    @Transactional
    public BookingDto cancel(Long userId, Long id) {
        Booking b = loadFor(userId, id);
        if (b.getStatus() != Booking.Status.REQUESTED && b.getStatus() != Booking.Status.ACCEPTED)
            throw ApiException.badRequest("Only unpaid bookings can be cancelled");
        boolean wasAccepted = b.getStatus() == Booking.Status.ACCEPTED;
        b.setStatus(Booking.Status.CANCELLED);
        if (wasAccepted) listings.unblock(b.getListingId(), b.getId());
        Long other = b.getOwner().getId().equals(userId) ? b.getRenter().getId() : b.getOwner().getId();
        notifier.notify(other, "BOOKING_CANCELLED", "Booking " + b.getCode() + " was cancelled.", b.getId());
        return toDto(b);
    }

    // ---------- condition photos, handover, return ----------
    @Transactional
    public PhotoDto addPhoto(Long userId, Long id, PhotoRequest r) {
        Booking b = loadFor(userId, id);
        if (CurrentUser.isAdmin() && !isParticipant(b, userId)) throw ApiException.forbidden("Only the renter or owner can add photos");
        Booking.Status needed = r.stage() == ConditionPhoto.Stage.HANDOVER ? Booking.Status.PAID : Booking.Status.ACTIVE;
        require(b, needed);
        uploads.assertAllowedUrl(r.url());
        ConditionPhoto p = new ConditionPhoto();
        p.setBooking(b);
        p.setStage(r.stage());
        p.setAngle(r.angle().trim().toLowerCase());
        p.setUrl(r.url());
        p.setNotes(r.notes());
        p.setUploadedBy(users.get(userId));
        return PhotoDto.from(photos.save(p));
    }

    @Transactional(readOnly = true)
    public List<PhotoDto> photos(Long userId, Long id) {
        loadFor(userId, id);
        return photos.findByBooking_IdOrderByIdAsc(id).stream().map(PhotoDto::from).toList();
    }

    /** Side-by-side pairs by angle: the latest handover photo vs the latest return photo. */
    @Transactional(readOnly = true)
    public List<ComparisonDto> comparison(Long userId, Long id) {
        loadFor(userId, id);
        Map<String, PhotoDto> h = new LinkedHashMap<>(), r = new LinkedHashMap<>();
        for (ConditionPhoto p : photos.findByBooking_IdOrderByIdAsc(id))
            (p.getStage() == ConditionPhoto.Stage.HANDOVER ? h : r).put(p.getAngle(), PhotoDto.from(p));
        Set<String> angles = new LinkedHashSet<>(h.keySet());
        angles.addAll(r.keySet());
        return angles.stream().map(a -> new ComparisonDto(a, h.get(a), r.get(a))).toList();
    }

    @Transactional
    public BookingDto handover(Long ownerId, Long id) {
        Booking b = asOwner(ownerId, id);
        require(b, Booking.Status.PAID);
        if (photos.countByBooking_IdAndStage(id, ConditionPhoto.Stage.HANDOVER) == 0)
            throw ApiException.badRequest("Upload at least one handover photo first");
        b.setStatus(Booking.Status.ACTIVE);
        b.setHandoverAt(LocalDateTime.now());
        notifier.notify(b.getRenter().getId(), "HANDOVER_DONE", "Handover of " + b.getListingTitle() + " is confirmed. Enjoy!", b.getId());
        return toDto(b);
    }

    @Transactional
    public BookingDto returnItem(Long renterId, Long id) {
        Booking b = loadFor(renterId, id);
        if (!b.getRenter().getId().equals(renterId)) throw ApiException.forbidden("Only the renter can mark the item returned");
        require(b, Booking.Status.ACTIVE);
        if (photos.countByBooking_IdAndStage(id, ConditionPhoto.Stage.RETURN) == 0)
            throw ApiException.badRequest("Upload at least one return photo first");
        b.setStatus(Booking.Status.RETURNED);
        b.setReturnedAt(LocalDateTime.now());
        notifier.notify(b.getOwner().getId(), "ITEM_RETURNED", b.getListingTitle() + " was returned. Please check its condition.", b.getId());
        return toDto(b);
    }

    // ---------- reads ----------
    @Transactional(readOnly = true)
    public List<BookingDto> mine(Long userId, String role, Booking.Status status) {
        List<Booking> list = "owner".equalsIgnoreCase(role)
                ? bookings.findByOwner_IdOrderByCreatedAtDesc(userId) : bookings.findByRenter_IdOrderByCreatedAtDesc(userId);
        return list.stream().filter(b -> status == null || b.getStatus() == status).map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto get(Long userId, Long id) { return toDto(loadFor(userId, id)); }

    @Transactional(readOnly = true)
    public List<BookingDto> disputes() {
        return bookings.findByStatusOrderByUpdatedAtDesc(Booking.Status.DISPUTED).stream().map(this::toDto).toList();
    }

    // ---------- shared helpers ----------
    public Booking load(Long id) { return bookings.findById(id).orElseThrow(() -> ApiException.notFound("Booking not found")); }

    /** Loads a booking only for its owner, its renter, or an admin. */
    public Booking loadFor(Long userId, Long id) {
        Booking b = load(id);
        if (!isParticipant(b, userId) && !CurrentUser.isAdmin()) throw ApiException.forbidden("You're not part of this booking");
        return b;
    }

    public boolean isParticipant(Booking b, Long userId) { return b.getOwner().getId().equals(userId) || b.getRenter().getId().equals(userId); }

    private Booking asOwner(Long ownerId, Long id) {
        Booking b = load(id);
        if (!b.getOwner().getId().equals(ownerId)) throw ApiException.forbidden("Only the owner can do this");
        return b;
    }

    private void require(Booking b, Booking.Status expected) {
        if (b.getStatus() != expected)
            throw ApiException.conflict("Booking is " + b.getStatus() + ", expected " + expected);
    }

    public BookingDto toDto(Booking b) {
        SettlementDto s = settlements.findByBooking_Id(b.getId()).map(SettlementDto::from).orElse(null);
        return BookingDto.from(b, s);
    }
}
