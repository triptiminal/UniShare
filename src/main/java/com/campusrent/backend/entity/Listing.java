package com.campusrent.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/** Listings live in MongoDB: each category has its own attribute shape under "attributes". */
@Document("listings")
@Getter @Setter @NoArgsConstructor
public class Listing {
    public enum Category { ELECTRONICS, CYCLES, FURNITURE, BOOKS, APPLIANCES, SPORTS, LAB_EQUIPMENT, OTHER }
    public enum Condition { LIKE_NEW, GOOD, FAIR }
    public enum Status { ACTIVE, INACTIVE, ARCHIVED }

    @Id private String id;
    @Indexed private Long ownerId; // MySQL users.id (app-level reference)
    private String title;
    private String description;
    private Category category;
    private String subcategory;
    private Condition condition;
    private List<String> photos = new ArrayList<>();
    private double pricePerDay;     // stored as double so Mongo can range-query/sort it
    private double depositAmount;
    private String campus;
    private List<String> includedItems = new ArrayList<>();
    private Map<String, Object> attributes = new HashMap<>();
    private List<BlockedRange> blockedRanges = new ArrayList<>();
    private Status status = Status.ACTIVE;
    private boolean flagged;
    private String flagReason;
    private double ratingAvg;
    private int ratingCount;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class BlockedRange {
        private LocalDate start;
        private LocalDate end;
        private Long bookingId;
    }
}
