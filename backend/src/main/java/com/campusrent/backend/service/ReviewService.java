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
public class ReviewService {
    private final ReviewRepository reviews;
    private final BookingService bookingService;
    private final UserService users;
    private final ListingService listings;
    private final NotificationService notifier;

    /** Two-way reviews, allowed only for settled bookings, once per participant. */
    @Transactional
    public ReviewDto create(Long userId, Long bookingId, ReviewRequest r) {
        Booking b = bookingService.load(bookingId);
        if (!bookingService.isParticipant(b, userId)) throw ApiException.forbidden("You're not part of this booking");
        if (b.getStatus() != Booking.Status.SETTLED) throw ApiException.badRequest("You can review once the booking is settled");
        if (reviews.existsByBooking_IdAndReviewer_Id(bookingId, userId)) throw ApiException.conflict("You already reviewed this booking");
        boolean reviewerIsRenter = b.getRenter().getId().equals(userId);
        User reviewer = reviewerIsRenter ? b.getRenter() : b.getOwner();
        User reviewee = reviewerIsRenter ? b.getOwner() : b.getRenter();
        Review rv = new Review();
        rv.setBooking(b);
        rv.setReviewer(reviewer);
        rv.setReviewee(reviewee);
        rv.setRating(r.rating());
        rv.setComment(r.comment());
        reviews.save(rv);
        users.addRating(reviewee, r.rating());
        if (reviewerIsRenter) listings.addRating(b.getListingId(), r.rating());
        notifier.notify(reviewee.getId(), "NEW_REVIEW", reviewer.getName() + " left you a " + r.rating() + "-star review.", bookingId);
        return ReviewDto.from(rv);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> forUser(Long userId) { return reviews.findByReviewee_IdOrderByCreatedAtDesc(userId).stream().map(ReviewDto::from).toList(); }

    @Transactional(readOnly = true)
    public List<ReviewDto> forListing(String listingId) { return reviews.findForListing(listingId).stream().map(ReviewDto::from).toList(); }
}
