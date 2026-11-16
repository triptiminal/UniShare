package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByBooking_IdAndReviewer_Id(Long bookingId, Long reviewerId);
    List<Review> findByReviewee_IdOrderByCreatedAtDesc(Long revieweeId);

    /** Reviews written by renters about a given listing's bookings. */
    @Query("select r from Review r where r.booking.listingId = :lid and r.reviewer.id = r.booking.renter.id order by r.createdAt desc")
    List<Review> findForListing(@Param("lid") String listingId);
}
