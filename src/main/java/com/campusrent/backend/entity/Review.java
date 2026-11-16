package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"booking_id", "reviewer_id"}))
@Getter @Setter @NoArgsConstructor
public class Review extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @ManyToOne(optional = false) @JoinColumn(name = "reviewer_id") private User reviewer;
    @ManyToOne(optional = false) @JoinColumn(name = "reviewee_id") private User reviewee;
    @Column(nullable = false) private int rating;
    @Column(length = 1000) private String comment;
}
