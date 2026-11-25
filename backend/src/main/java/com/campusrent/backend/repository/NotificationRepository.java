package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop100ByUser_IdOrderByIdDesc(Long userId);
    long countByUser_IdAndSeenFalse(Long userId);
    List<Notification> findByUser_IdAndSeenFalse(Long userId);
    boolean existsByUser_IdAndBookingIdAndTypeAndSeenFalse(Long userId, Long bookingId, String type);
}
