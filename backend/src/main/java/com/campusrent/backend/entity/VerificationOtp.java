package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "verification_otps") @Getter @Setter @NoArgsConstructor
public class VerificationOtp extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false, length = 100) private String codeHash;
    @Column(nullable = false) private LocalDateTime expiresAt;
    @Column(nullable = false) private int attempts = 0;
    @Column(nullable = false) private boolean used = false;
}
