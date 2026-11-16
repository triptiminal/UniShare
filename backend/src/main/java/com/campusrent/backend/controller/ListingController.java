package com.campusrent.backend.controller;

import com.campusrent.backend.common.CurrentUser;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ListingController {
    private final ListingService listings;
    private final ReviewService reviews;
    private final SavedService saved;

    @GetMapping("/listings")
    public PageDto<ListingDto> search(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) Listing.Category category,
                                      @RequestParam(required = false) String subcategory,
                                      @RequestParam(required = false) String campus,
                                      @RequestParam(required = false) BigDecimal minPrice,
                                      @RequestParam(required = false) BigDecimal maxPrice,
                                      @RequestParam(required = false) Listing.Condition condition,
                                      @RequestParam(required = false) String sort,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return listings.search(q, category, subcategory, campus, minPrice, maxPrice, condition, sort, page, size);
    }

    @GetMapping("/listings/{id}")
    public ListingDto get(@PathVariable String id) { return listings.get(id); }

    @GetMapping("/listings/{id}/availability")
    public List<Listing.BlockedRange> availability(@PathVariable String id) { return listings.find(id).getBlockedRanges(); }

    @GetMapping("/listings/{id}/reviews")
    public List<ReviewDto> listingReviews(@PathVariable String id) { return reviews.forListing(id); }

    @GetMapping("/my/listings")
    public List<ListingDto> mine() { return listings.mine(CurrentUser.id()); }

    @PostMapping("/listings") @ResponseStatus(HttpStatus.CREATED)
    public ListingDto create(@Valid @RequestBody ListingRequest r) { return listings.create(CurrentUser.id(), r); }

    @PutMapping("/listings/{id}")
    public ListingDto update(@PathVariable String id, @Valid @RequestBody ListingRequest r) { return listings.update(CurrentUser.id(), id, r); }

    @PatchMapping("/listings/{id}/status")
    public ListingDto status(@PathVariable String id, @Valid @RequestBody StatusRequest r) { return listings.setStatus(CurrentUser.id(), id, r.status()); }

    @DeleteMapping("/listings/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { listings.delete(CurrentUser.id(), id); }

    @PostMapping("/listings/{id}/report") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(@PathVariable String id, @RequestBody(required = false) ReasonRequest r) { listings.report(id, r == null ? null : r.reason()); }

    // --- saved items ---
    @GetMapping("/saved") public List<ListingDto> savedList() { return saved.list(CurrentUser.id()); }
    @GetMapping("/saved/ids") public List<String> savedIds() { return saved.ids(CurrentUser.id()); }
    @PostMapping("/saved/{listingId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable String listingId) { saved.save(CurrentUser.id(), listingId); }
    @DeleteMapping("/saved/{listingId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@PathVariable String listingId) { saved.remove(CurrentUser.id(), listingId); }

    @GetMapping("/listings/categories")
    public Listing.Category[] categories() { return Listing.Category.values(); }
}
