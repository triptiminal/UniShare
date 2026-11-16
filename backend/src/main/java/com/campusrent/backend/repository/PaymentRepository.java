package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String orderId);
    Optional<Payment> findFirstByBooking_IdAndStatusInOrderByIdDesc(Long bookingId, Collection<Payment.Status> statuses);
    List<Payment> findByBooking_Renter_IdAndStatusIn(Long renterId, Collection<Payment.Status> statuses);
}
