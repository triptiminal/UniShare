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
public class UserService {
    private final UserRepository users;
    private final ListingRepository listings;
    private final BookingRepository bookings;
    private final UploadService uploads;

    @Transactional(readOnly = true)
    public User get(Long id) { return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found")); }

    /** Gate for listing/renting: must be verified and not suspended. */
    @Transactional(readOnly = true)
    public User requireVerified(Long id) {
        User u = get(id);
        if (u.isSuspended()) throw ApiException.forbidden("Your account is suspended");
        if (u.getVerificationStatus() != User.VerificationStatus.VERIFIED)
            throw ApiException.forbidden("Verify your college before using this feature");
        return u;
    }

    @Transactional(readOnly = true)
    public UserDto me(Long id) { return UserDto.from(get(id)); }

    @Transactional
    public UserDto update(Long id, UpdateProfileRequest r) {
        User u = get(id);
        if (r.name() != null && !r.name().isBlank()) u.setName(r.name().trim());
        if (r.phone() != null) u.setPhone(r.phone());
        if (r.yearOfStudy() != null) u.setYearOfStudy(r.yearOfStudy());
        if (r.branch() != null) u.setBranch(r.branch());
        if (r.bio() != null) u.setBio(r.bio());
        if (r.profilePhotoUrl() != null) { uploads.assertAllowedUrl(r.profilePhotoUrl()); u.setProfilePhotoUrl(r.profilePhotoUrl()); }
        return UserDto.from(u);
    }

    @Transactional(readOnly = true)
    public PublicProfile publicProfile(Long id) {
        User u = get(id);
        return new PublicProfile(OwnerSummary.from(u), u.getBio(), u.getCollege() == null ? null : u.getCollege().getName(),
                listings.countByOwnerIdAndStatus(id, Listing.Status.ACTIVE),
                bookings.countByOwner_IdAndStatus(id, Booking.Status.SETTLED),
                bookings.countByRenter_IdAndStatus(id, Booking.Status.SETTLED));
    }

    /** Running average of ratings received. */
    @Transactional
    public void addRating(User u, int rating) {
        BigDecimal total = u.getRatingAvg().multiply(BigDecimal.valueOf(u.getRatingCount())).add(BigDecimal.valueOf(rating));
        int n = u.getRatingCount() + 1;
        u.setRatingAvg(total.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP));
        u.setRatingCount(n);
    }
}
