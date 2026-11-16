package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRenter_IdOrderByCreatedAtDesc(Long renterId);
    List<Booking> findByOwner_IdOrderByCreatedAtDesc(Long ownerId);
    List<Booking> findByOwner_IdAndStatus(Long ownerId, Booking.Status status);
    List<Booking> findByStatusOrderByUpdatedAtDesc(Booking.Status status);
    boolean existsByListingId(String listingId);
    long countByStatus(Booking.Status status);
    long countByOwner_IdAndStatus(Long ownerId, Booking.Status status);
    long countByRenter_IdAndStatus(Long renterId, Booking.Status status);

    /** Strict overlap on [start, end): a booking ending on the 28th doesn't clash with one starting on the 28th. */
    @Query("select count(b) from Booking b where b.listingId = :lid and b.status in :st " +
           "and b.startDate < :end and b.endDate > :start")
    long countOverlap(@Param("lid") String listingId, @Param("st") Collection<Booking.Status> statuses,
                      @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select coalesce(sum(b.rentalPrice), 0) from Booking b where b.status = :s")
    BigDecimal sumRent(@Param("s") Booking.Status status);

    @Query("select coalesce(sum(b.platformFee), 0) from Booking b where b.status = :s")
    BigDecimal sumFees(@Param("s") Booking.Status status);
}
