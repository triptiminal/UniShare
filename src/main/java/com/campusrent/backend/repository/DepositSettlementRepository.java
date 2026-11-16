package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface DepositSettlementRepository extends JpaRepository<DepositSettlement, Long> {
    Optional<DepositSettlement> findByBooking_Id(Long bookingId);
}
