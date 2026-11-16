package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "deposit_settlements") @Getter @Setter @NoArgsConstructor
public class DepositSettlement extends BaseEntity {
    public enum RenterResponse { PENDING, ACCEPTED, DISPUTED }
    public enum AdminResolution { NONE, APPROVED, ADJUSTED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(optional = false) @JoinColumn(name = "booking_id", unique = true) private Booking booking;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal deductedAmount = BigDecimal.ZERO; // claimed
    @Column(length = 500) private String deductionReason;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "settlement_evidence", joinColumns = @JoinColumn(name = "settlement_id"))
    @Column(name = "photo_id")
    private List<Long> evidencePhotoIds = new ArrayList<>();
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private RenterResponse renterResponse = RenterResponse.PENDING;
    @Column(length = 500) private String disputeReason;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private AdminResolution adminResolution = AdminResolution.NONE;
    @Column(precision = 10, scale = 2) private BigDecimal resolvedAmount; // final amount actually deducted
    @ManyToOne @JoinColumn(name = "resolved_by") private User resolvedBy;
    private LocalDateTime resolvedAt;
    @Column(length = 500) private String adminNotes;
}
