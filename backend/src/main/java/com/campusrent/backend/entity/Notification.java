package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "notifications") @Getter @Setter @NoArgsConstructor
public class Notification extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false, length = 60) private String type;
    @Column(nullable = false, length = 500) private String message;
    private Long bookingId;
    @Column(name = "is_seen", nullable = false) private boolean seen = false;
}
