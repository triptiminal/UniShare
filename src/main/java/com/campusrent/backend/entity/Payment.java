package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "payments") @Getter @Setter @NoArgsConstructor
public class Payment extends BaseEntity {
    public enum Status { CREATED, CAPTURED, FAILED, PARTIALLY_REFUNDED, REFUNDED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @Column(nullable = false, unique = true, length = 64) private String razorpayOrderId;
    @Column(length = 64) private String razorpayPaymentId;
    @Column(length = 255) private String razorpaySignature;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal rentAmount;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal platformFee;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal depositAmount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 25) private Status status = Status.CREATED;
}
