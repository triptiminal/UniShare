package com.campusrent.backend.repository;

import com.campusrent.backend.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);
    long countByRole(User.Role role);
    long countByVerificationStatus(User.VerificationStatus s);

    @Query("select u from User u where (:status is null or u.verificationStatus = :status) " +
           "and (:q = '' or lower(u.name) like lower(concat('%', :q, '%')) or lower(u.email) like lower(concat('%', :q, '%')))")
    Page<User> search(@Param("status") User.VerificationStatus status, @Param("q") String q, Pageable pageable);
}
