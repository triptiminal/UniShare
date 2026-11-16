package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "refresh_tokens") @Getter @Setter @NoArgsConstructor
public class RefreshToken extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(nullable = false, unique = true, length = 100) private String tokenHash;
    @Column(nullable = false) private LocalDateTime expiresAt;
    @Column(nullable = false) private boolean revoked = false;
}
