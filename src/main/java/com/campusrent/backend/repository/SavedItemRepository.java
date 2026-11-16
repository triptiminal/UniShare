package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface SavedItemRepository extends JpaRepository<SavedItem, Long> {
    List<SavedItem> findByUser_IdOrderByIdDesc(Long userId);
    Optional<SavedItem> findByUser_IdAndListingId(Long userId, String listingId);
}
