package com.campusrent.backend.repository;

import com.campusrent.backend.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ListingRepository extends MongoRepository<Listing, String> {
    List<Listing> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    long countByOwnerIdAndStatus(Long ownerId, Listing.Status status);
    long countByFlaggedTrue();
    Page<Listing> findByFlaggedTrue(Pageable pageable);
}
