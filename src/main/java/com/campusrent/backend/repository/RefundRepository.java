package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface RefundRepository extends JpaRepository<Refund, Long> {
    Optional<Refund> findByRazorpayRefundId(String id);
    List<Refund> findByPayment_Booking_Renter_Id(Long renterId);
}
