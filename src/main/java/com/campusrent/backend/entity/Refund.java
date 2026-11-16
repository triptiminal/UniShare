package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "refunds") @Getter @Setter @NoArgsConstructor
public class Refund extends BaseEntity {
    public enum Status { INITIATED, PROCESSED, FAILED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "payment_id") private Payment payment;
    @Column(unique = true, length = 64) private String razorpayRefundId;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(length = 255) private String reason;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status = Status.INITIATED;
}
