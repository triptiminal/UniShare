package com.campusrent.backend.service;

import com.campusrent.backend.common.*;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository repo;
    private final org.springframework.data.mongodb.core.MongoTemplate mongo;
    private final UserService users;
    private final BookingRepository bookings;
    private final UploadService uploads;

    // ---------- CRUD ----------
    public ListingDto create(Long ownerId, ListingRequest r) {
        users.requireVerified(ownerId);
        Listing l = new Listing();
        l.setOwnerId(ownerId);
        l.setCreatedAt(Instant.now());
        apply(l, r);
        return dto(repo.save(l));
    }

    public ListingDto update(Long userId, String id, ListingRequest r) {
        Listing l = owned(userId, id);
        apply(l, r);
        return dto(repo.save(l));
    }

    public ListingDto setStatus(Long userId, String id, Listing.Status status) {
        if (status == Listing.Status.ARCHIVED) throw ApiException.badRequest("Use DELETE to remove a listing");
        Listing l = owned(userId, id);
        l.setStatus(status);
        l.setUpdatedAt(Instant.now());
        return dto(repo.save(l));
    }

    /** Listings with booking history are archived, never hard-deleted, so old bookings/disputes still resolve. */
    public void delete(Long userId, String id) {
        Listing l = owned(userId, id);
        if (bookings.existsByListingId(id)) { l.setStatus(Listing.Status.ARCHIVED); l.setUpdatedAt(Instant.now()); repo.save(l); }
        else repo.delete(l);
    }

    public void report(String id, String reason) {
        Listing l = find(id);
        l.setFlagged(true);
        l.setFlagReason(reason == null || reason.isBlank() ? "Reported by a user" : reason);
        repo.save(l);
    }

    private void apply(Listing l, ListingRequest r) {
        List<String> photos = r.photos() == null ? List.of() : r.photos();
        photos.forEach(uploads::assertAllowedUrl);
        l.setTitle(r.title().trim());
        l.setDescription(r.description());
        l.setCategory(r.category());
        l.setSubcategory(r.subcategory());
        l.setCondition(r.condition());
        l.setPhotos(new ArrayList<>(photos));
        l.setPricePerDay(r.pricePerDay().doubleValue());
        l.setDepositAmount(r.depositAmount().doubleValue());
        l.setCampus(r.campus().trim());
        l.setIncludedItems(r.includedItems() == null ? new ArrayList<>() : new ArrayList<>(r.includedItems()));
        l.setAttributes(r.attributes() == null ? new HashMap<>() : new HashMap<>(r.attributes()));
        l.setUpdatedAt(Instant.now());
    }

    // ---------- reads ----------
    public Listing find(String id) { return repo.findById(id).orElseThrow(() -> ApiException.notFound("Listing not found")); }

    public Listing getActive(String id) {
        Listing l = find(id);
        if (l.getStatus() != Listing.Status.ACTIVE || l.isFlagged()) throw ApiException.badRequest("This listing isn't available");
        return l;
    }

    public ListingDto get(String id) { return dto(find(id)); }

    public List<ListingDto> mine(Long ownerId) { return repo.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream().map(this::dto).toList(); }

    public List<ListingDto> byIds(Collection<String> ids) { return repo.findAllById(ids).stream().map(this::dto).toList(); }

    public PageDto<ListingDto> search(String q, Listing.Category category, String subcategory, String campus, BigDecimal min,
                                      BigDecimal max, Listing.Condition condition, String sort, int page, int size) {
        size = Math.min(Math.max(size, 1), 50);
        page = Math.max(page, 0);
        List<org.springframework.data.mongodb.core.query.Criteria> all = new ArrayList<>();
        all.add(org.springframework.data.mongodb.core.query.Criteria.where("status").is(Listing.Status.ACTIVE));
        all.add(org.springframework.data.mongodb.core.query.Criteria.where("flagged").is(false));
        if (q != null && !q.isBlank()) {
            String rx = java.util.regex.Pattern.quote(q.trim());
            all.add(new org.springframework.data.mongodb.core.query.Criteria().orOperator(
                    org.springframework.data.mongodb.core.query.Criteria.where("title").regex(rx, "i"),
                    org.springframework.data.mongodb.core.query.Criteria.where("description").regex(rx, "i")));
        }
        if (category != null) all.add(org.springframework.data.mongodb.core.query.Criteria.where("category").is(category));
        if (subcategory != null && !subcategory.isBlank())
            all.add(org.springframework.data.mongodb.core.query.Criteria.where("subcategory").regex("^" + java.util.regex.Pattern.quote(subcategory.trim()) + "$", "i"));
        if (campus != null && !campus.isBlank())
            all.add(org.springframework.data.mongodb.core.query.Criteria.where("campus").regex("^" + java.util.regex.Pattern.quote(campus.trim()) + "$", "i"));
        if (condition != null) all.add(org.springframework.data.mongodb.core.query.Criteria.where("condition").is(condition));
        if (min != null) all.add(org.springframework.data.mongodb.core.query.Criteria.where("pricePerDay").gte(min.doubleValue()));
        if (max != null) all.add(org.springframework.data.mongodb.core.query.Criteria.where("pricePerDay").lte(max.doubleValue()));

        var query = new org.springframework.data.mongodb.core.query.Query(
                new org.springframework.data.mongodb.core.query.Criteria().andOperator(all.toArray(new org.springframework.data.mongodb.core.query.Criteria[0])));
        long total = mongo.count(query, Listing.class);
        org.springframework.data.domain.Sort order = switch (sort == null ? "" : sort) {
            case "price_asc" -> org.springframework.data.domain.Sort.by("pricePerDay").ascending();
            case "price_desc" -> org.springframework.data.domain.Sort.by("pricePerDay").descending();
            case "rating" -> org.springframework.data.domain.Sort.by("ratingAvg").descending();
            default -> org.springframework.data.domain.Sort.by("createdAt").descending();
        };
        query.with(order).skip((long) page * size).limit(size);
        List<ListingDto> items = mongo.find(query, Listing.class).stream().map(this::dto).toList();
        return new PageDto<>(items, page, size, total);
    }

    // ---------- booking integration ----------
    /** Calendar blocks are mirrored from accepted bookings; MySQL bookings remain the source of truth for conflicts. */
    public void block(String listingId, Long bookingId, LocalDate start, LocalDate end) {
        Listing l = find(listingId);
        l.getBlockedRanges().removeIf(b -> bookingId.equals(b.getBookingId()));
        l.getBlockedRanges().add(new Listing.BlockedRange(start, end, bookingId));
        repo.save(l);
    }

    public void unblock(String listingId, Long bookingId) {
        repo.findById(listingId).ifPresent(l -> {
            if (l.getBlockedRanges().removeIf(b -> bookingId.equals(b.getBookingId()))) repo.save(l);
        });
    }

    public void addRating(String listingId, int rating) {
        repo.findById(listingId).ifPresent(l -> {
            double total = l.getRatingAvg() * l.getRatingCount() + rating;
            l.setRatingCount(l.getRatingCount() + 1);
            l.setRatingAvg(Math.round(total / l.getRatingCount() * 100.0) / 100.0);
            repo.save(l);
        });
    }

    // ---------- helpers ----------
    private Listing owned(Long userId, String id) {
        Listing l = find(id);
        if (!l.getOwnerId().equals(userId)) throw ApiException.forbidden("This isn't your listing");
        return l;
    }

    public ListingDto dto(Listing l) { return ListingDto.from(l, OwnerSummary.from(users.get(l.getOwnerId()))); }
}
