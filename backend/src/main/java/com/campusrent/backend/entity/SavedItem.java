package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "saved_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "listing_id"}))
@Getter @Setter @NoArgsConstructor
public class SavedItem extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(name = "listing_id", nullable = false, length = 24) private String listingId;
}
