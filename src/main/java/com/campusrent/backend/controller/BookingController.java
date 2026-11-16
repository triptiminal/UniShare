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
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookings;
    private final PaymentService payments;
    private final SettlementService settlement;
    private final ReviewService reviews;

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BookingDto request(@Valid @RequestBody BookingRequest r) { return bookings.request(CurrentUser.id(), r); }

    /** role=renter (default) or owner; optional exact status filter. */
    @GetMapping
    public List<BookingDto> mine(@RequestParam(defaultValue = "renter") String role, @RequestParam(required = false) Booking.Status status) {
        return bookings.mine(CurrentUser.id(), role, status);
    }

    @GetMapping("/{id}") public BookingDto get(@PathVariable Long id) { return bookings.get(CurrentUser.id(), id); }

    @PostMapping("/{id}/accept") public BookingDto accept(@PathVariable Long id) { return bookings.accept(CurrentUser.id(), id); }
    @PostMapping("/{id}/decline")
    public BookingDto decline(@PathVariable Long id, @RequestBody(required = false) ReasonRequest r) {
        return bookings.decline(CurrentUser.id(), id, r == null ? null : r.reason());
    }
    @PostMapping("/{id}/cancel") public BookingDto cancel(@PathVariable Long id) { return bookings.cancel(CurrentUser.id(), id); }

    // --- payment ---
    @PostMapping("/{id}/pay") public PayInit pay(@PathVariable Long id) { return payments.initiate(CurrentUser.id(), id); }

    // --- condition evidence ---
    @PostMapping("/{id}/photos") @ResponseStatus(HttpStatus.CREATED)
    public PhotoDto addPhoto(@PathVariable Long id, @Valid @RequestBody PhotoRequest r) { return bookings.addPhoto(CurrentUser.id(), id, r); }
    @GetMapping("/{id}/photos") public List<PhotoDto> photos(@PathVariable Long id) { return bookings.photos(CurrentUser.id(), id); }
    @GetMapping("/{id}/comparison") public List<ComparisonDto> comparison(@PathVariable Long id) { return bookings.comparison(CurrentUser.id(), id); }
    @PostMapping("/{id}/handover") public BookingDto handover(@PathVariable Long id) { return bookings.handover(CurrentUser.id(), id); }
    @PostMapping("/{id}/return") public BookingDto returned(@PathVariable Long id) { return bookings.returnItem(CurrentUser.id(), id); }

    // --- deposit settlement & disputes ---
    @PostMapping("/{id}/settlement/release") public BookingDto release(@PathVariable Long id) { return settlement.release(CurrentUser.id(), id); }
    @PostMapping("/{id}/settlement/claim")
    public BookingDto claim(@PathVariable Long id, @Valid @RequestBody ClaimRequest r) { return settlement.claim(CurrentUser.id(), id, r); }
    @PostMapping("/{id}/settlement/respond")
    public BookingDto respond(@PathVariable Long id, @RequestBody RespondRequest r) { return settlement.respond(CurrentUser.id(), id, r); }

    // --- reviews ---
    @PostMapping("/{id}/reviews") @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto review(@PathVariable Long id, @Valid @RequestBody ReviewRequest r) { return reviews.create(CurrentUser.id(), id, r); }
}
