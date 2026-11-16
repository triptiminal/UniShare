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
public class SavedService {
    private final SavedItemRepository repo;
    private final UserRepository users;
    private final ListingService listings;

    @Transactional
    public void save(Long userId, String listingId) {
        listings.find(listingId);
        if (repo.findByUser_IdAndListingId(userId, listingId).isEmpty()) {
            SavedItem s = new SavedItem();
            s.setUser(users.getReferenceById(userId));
            s.setListingId(listingId);
            repo.save(s);
        }
    }

    @Transactional
    public void remove(Long userId, String listingId) { repo.findByUser_IdAndListingId(userId, listingId).ifPresent(repo::delete); }

    @Transactional(readOnly = true)
    public List<String> ids(Long userId) { return repo.findByUser_IdOrderByIdDesc(userId).stream().map(SavedItem::getListingId).toList(); }

    @Transactional(readOnly = true)
    public List<ListingDto> list(Long userId) { return listings.byIds(ids(userId)); }
}
