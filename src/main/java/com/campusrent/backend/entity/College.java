package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "colleges") @Getter @Setter @NoArgsConstructor
public class College extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 150) private String name;
    @Column(nullable = false, unique = true, length = 120) private String emailDomain;
    @Column(length = 100) private String campus;
}
