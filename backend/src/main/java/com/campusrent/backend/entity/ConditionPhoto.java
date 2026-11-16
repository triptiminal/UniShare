package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "condition_photos") @Getter @Setter @NoArgsConstructor
public class ConditionPhoto extends BaseEntity {
    public enum Stage { HANDOVER, RETURN }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Stage stage;
    @Column(nullable = false, length = 30) private String angle; // front, back, top, accessories...
    @Column(nullable = false, length = 500) private String url;
    @ManyToOne(optional = false) @JoinColumn(name = "uploaded_by") private User uploadedBy;
    @Column(length = 500) private String notes;
}
