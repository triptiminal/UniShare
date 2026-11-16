package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "users") @Getter @Setter @NoArgsConstructor
public class User extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, unique = true, length = 180) private String email;
    @Column(nullable = false) private String passwordHash;
    @Column(length = 20) private String phone;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Role role = Role.STUDENT;
    @ManyToOne @JoinColumn(name = "college_id") private College college;
    @Column(length = 60) private String collegeIdNumber;
    @Column(length = 30) private String yearOfStudy;
    @Column(length = 80) private String branch;
    @Column(length = 500) private String bio;
    @Column(length = 500) private String profilePhotoUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    @Column(length = 500) private String verificationDocUrl;
    private LocalDateTime verifiedAt;
    @Column(nullable = false) private boolean suspended = false;
    @Column(nullable = false, precision = 3, scale = 2) private BigDecimal ratingAvg = BigDecimal.ZERO;
    @Column(nullable = false) private int ratingCount = 0;

    public enum Role { STUDENT, ADMIN }
    public enum VerificationStatus { PENDING, VERIFIED, REJECTED }
}
