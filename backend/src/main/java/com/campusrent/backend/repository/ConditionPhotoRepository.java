package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface ConditionPhotoRepository extends JpaRepository<ConditionPhoto, Long> {
    List<ConditionPhoto> findByBooking_IdOrderByIdAsc(Long bookingId);
    long countByBooking_IdAndStage(Long bookingId, ConditionPhoto.Stage stage);
}
