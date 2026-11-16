package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "bookings") @Getter @Setter @NoArgsConstructor
public class Booking extends BaseEntity {
    public enum Status { REQUESTED, ACCEPTED, DECLINED, CANCELLED, PAID, ACTIVE, RETURNED, UNDER_REVIEW,
        DEDUCTION_ACCEPTED, DISPUTED, SETTLED }

    /** Statuses during which the item is reserved for the renter (used for date-conflict checks). */
    public static final List<Status> BLOCKING = List.of(Status.ACCEPTED, Status.PAID, Status.ACTIVE,
            Status.RETURNED, Status.UNDER_REVIEW, Status.DEDUCTION_ACCEPTED, Status.DISPUTED);

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, length = 20) private String code; // human-readable, e.g. CR-30042
    @Column(nullable = false, length = 24) private String listingId; // MongoDB ObjectId (app-level reference)
    @Column(length = 200) private String listingTitle;
    @Column(length = 500) private String listingPhoto;
    @ManyToOne(optional = false) @JoinColumn(name = "owner_id") private User owner;
    @ManyToOne(optional = false) @JoinColumn(name = "renter_id") private User renter;
    @Column(nullable = false) private LocalDate startDate;
    @Column(nullable = false) private LocalDate endDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 25) private Status status = Status.REQUESTED;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal rentalPrice;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal platformFee;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal depositAmount;
    private LocalDateTime acceptedAt, declinedAt, paidAt, handoverAt, returnedAt, settledAt;
    @Column(length = 300) private String declineReason;

    public BigDecimal total() { return rentalPrice.add(platformFee).add(depositAmount); }
    public long days() { return java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate); }
}
