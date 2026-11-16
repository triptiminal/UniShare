package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "admin_actions") @Getter @Setter @NoArgsConstructor
public class AdminAction extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "admin_id") private User admin;
    @Column(nullable = false, length = 60) private String actionType;
    @Column(nullable = false, length = 40) private String targetType;
    @Column(nullable = false, length = 40) private String targetId;
    @Column(length = 500) private String notes;
}
