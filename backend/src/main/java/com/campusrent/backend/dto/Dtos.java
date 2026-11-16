package com.campusrent.backend.dto;

import com.campusrent.backend.entity.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** All request/response shapes of the API, grouped by feature. */
public final class Dtos {
    private Dtos() {}

    public record PageDto<T>(List<T> items, int page, int size, long total) {}

    // ---------- auth & users ----------
    public record RegisterRequest(@NotBlank String name, @NotBlank @Email String email,
                                  @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
                                  String phone, @NotNull Long collegeId, String collegeIdNumber) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record AuthResponse(String accessToken, String refreshToken, UserDto user) {}
    public record UpdateProfileRequest(String name, String phone, String yearOfStudy, String branch, String bio,
                                       String profilePhotoUrl) {}
    public record OtpConfirmRequest(@NotBlank String code) {}
    public record IdSubmitRequest(@NotBlank String docUrl) {}
    public record CollegeRequest(@NotBlank String name, @NotBlank String emailDomain, String campus) {}
    public record CollegeDto(Long id, String name, String emailDomain, String campus) {
        public static CollegeDto from(College c) { return new CollegeDto(c.getId(), c.getName(), c.getEmailDomain(), c.getCampus()); }
    }

    public record UserDto(Long id, String name, String email, String role, String phone, Long collegeId, String collegeName,
                          String campus, String yearOfStudy, String branch, String bio, String profilePhotoUrl,
                          String verificationStatus, boolean suspended, BigDecimal ratingAvg, int ratingCount) {
        public static UserDto from(User u) {
            College c = u.getCollege();
            return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getPhone(),
                    c == null ? null : c.getId(), c == null ? null : c.getName(), c == null ? null : c.getCampus(),
                    u.getYearOfStudy(), u.getBranch(), u.getBio(), u.getProfilePhotoUrl(),
                    u.getVerificationStatus().name(), u.isSuspended(), u.getRatingAvg(), u.getRatingCount());
        }
    }

    /** Minimal, public-safe view of a user (shown on listings and bookings). */
    public record OwnerSummary(Long id, String name, String yearOfStudy, String branch, String campus,
                               boolean verified, BigDecimal ratingAvg, String profilePhotoUrl) {
        public static OwnerSummary from(User u) {
            return new OwnerSummary(u.getId(), u.getName(), u.getYearOfStudy(), u.getBranch(),
                    u.getCollege() == null ? null : u.getCollege().getCampus(),
                    u.getVerificationStatus() == User.VerificationStatus.VERIFIED, u.getRatingAvg(), u.getProfilePhotoUrl());
        }
    }

    public record PublicProfile(OwnerSummary user, String bio, String collegeName, long activeListings, long completedAsOwner,
                                long completedAsRenter) {}

    // ---------- listings ----------
    public record ListingRequest(@NotBlank String title, String description, @NotNull Listing.Category category,
                                 String subcategory, @NotNull Listing.Condition condition, List<String> photos,
                                 @NotNull @DecimalMin("1") BigDecimal pricePerDay,
                                 @NotNull @DecimalMin("0") BigDecimal depositAmount, @NotBlank String campus,
                                 List<String> includedItems, Map<String, Object> attributes) {}
    public record StatusRequest(@NotNull Listing.Status status) {}
    public record ReasonRequest(String reason) {}

    public record ListingDto(String id, OwnerSummary owner, String title, String description, Listing.Category category,
                             String subcategory, Listing.Condition condition, List<String> photos, double pricePerDay,
                             double depositAmount, String campus, List<String> includedItems, Map<String, Object> attributes,
                             List<Listing.BlockedRange> blockedRanges, Listing.Status status, boolean flagged,
                             double ratingAvg, int ratingCount) {
        public static ListingDto from(Listing l, OwnerSummary o) {
            return new ListingDto(l.getId(), o, l.getTitle(), l.getDescription(), l.getCategory(), l.getSubcategory(),
                    l.getCondition(), l.getPhotos(), l.getPricePerDay(), l.getDepositAmount(), l.getCampus(),
                    l.getIncludedItems(), l.getAttributes(), l.getBlockedRanges(), l.getStatus(), l.isFlagged(),
                    l.getRatingAvg(), l.getRatingCount());
        }
    }

    // ---------- bookings ----------
    public record BookingRequest(@NotBlank String listingId, @NotNull LocalDate startDate, @NotNull LocalDate endDate) {}
    public record PhotoRequest(@NotNull ConditionPhoto.Stage stage, @NotBlank String angle, @NotBlank String url, String notes) {}
    public record ClaimRequest(@NotNull @DecimalMin("0.01") BigDecimal amount, @NotBlank String reason, List<Long> evidencePhotoIds) {}
    public record RespondRequest(boolean accept, String reason) {}
    public record ResolveRequest(@NotNull DepositSettlement.AdminResolution resolution, BigDecimal amount, String notes) {}

    public record PhotoDto(Long id, ConditionPhoto.Stage stage, String angle, String url, Long uploadedBy, String notes,
                           LocalDateTime uploadedAt) {
        public static PhotoDto from(ConditionPhoto p) {
            return new PhotoDto(p.getId(), p.getStage(), p.getAngle(), p.getUrl(), p.getUploadedBy().getId(), p.getNotes(), p.getCreatedAt());
        }
    }
    public record ComparisonDto(String angle, PhotoDto handover, PhotoDto returned) {}

    public record SettlementDto(Long id, Long bookingId, BigDecimal claimedAmount, String reason, List<Long> evidencePhotoIds,
                                DepositSettlement.RenterResponse renterResponse, String disputeReason,
                                DepositSettlement.AdminResolution adminResolution, BigDecimal finalDeduction,
                                String adminNotes, LocalDateTime resolvedAt) {
        public static SettlementDto from(DepositSettlement s) {
            return new SettlementDto(s.getId(), s.getBooking().getId(), s.getDeductedAmount(), s.getDeductionReason(),
                    s.getEvidencePhotoIds(), s.getRenterResponse(), s.getDisputeReason(), s.getAdminResolution(),
                    s.getResolvedAmount(), s.getAdminNotes(), s.getResolvedAt());
        }
    }

    public record BookingDto(Long id, String code, String listingId, String listingTitle, String listingPhoto,
                             OwnerSummary owner, OwnerSummary renter, LocalDate startDate, LocalDate endDate, long days,
                             Booking.Status status, BigDecimal rentalPrice, BigDecimal platformFee, BigDecimal depositAmount,
                             BigDecimal total, LocalDateTime requestedAt, LocalDateTime acceptedAt, LocalDateTime paidAt,
                             LocalDateTime handoverAt, LocalDateTime returnedAt, LocalDateTime settledAt,
                             String declineReason, SettlementDto settlement) {
        public static BookingDto from(Booking b, SettlementDto s) {
            return new BookingDto(b.getId(), b.getCode(), b.getListingId(), b.getListingTitle(), b.getListingPhoto(),
                    OwnerSummary.from(b.getOwner()), OwnerSummary.from(b.getRenter()), b.getStartDate(), b.getEndDate(),
                    b.days(), b.getStatus(), b.getRentalPrice(), b.getPlatformFee(), b.getDepositAmount(), b.total(),
                    b.getCreatedAt(), b.getAcceptedAt(), b.getPaidAt(), b.getHandoverAt(), b.getReturnedAt(),
                    b.getSettledAt(), b.getDeclineReason(), s);
        }
    }

    public record DisputeDetail(BookingDto booking, List<ComparisonDto> comparison, List<PhotoDto> photos) {}

    // ---------- payments ----------
    public record PayInit(Long bookingId, String orderId, long amountPaise, String currency, String keyId) {}
    public record VerifyPaymentRequest(@NotBlank String razorpayOrderId, @NotBlank String razorpayPaymentId,
                                       @NotBlank String razorpaySignature) {}
    public record TransactionDto(LocalDateTime date, String kind, String label, BigDecimal amount, String bookingCode) {}

    // ---------- reviews, chat, notifications ----------
    public record ReviewRequest(@Min(1) @Max(5) int rating, @Size(max = 1000) String comment) {}
    public record ReviewDto(Long id, String bookingCode, Long reviewerId, String reviewerName, Long revieweeId, int rating,
                            String comment, LocalDateTime createdAt) {
        public static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getBooking().getCode(), r.getReviewer().getId(), r.getReviewer().getName(),
                    r.getReviewee().getId(), r.getRating(), r.getComment(), r.getCreatedAt());
        }
    }
    public record MessageRequest(@NotBlank @Size(max = 2000) String content) {}
    public record MessageDto(Long id, Long bookingId, Long senderId, String senderName, String content, LocalDateTime sentAt) {
        public static MessageDto from(ChatMessage m) {
            return new MessageDto(m.getId(), m.getBooking().getId(), m.getSender().getId(), m.getSender().getName(),
                    m.getContent(), m.getCreatedAt());
        }
    }
    public record NotificationDto(Long id, String type, String message, Long bookingId, boolean seen, LocalDateTime createdAt) {
        public static NotificationDto from(Notification n) {
            return new NotificationDto(n.getId(), n.getType(), n.getMessage(), n.getBookingId(), n.isSeen(), n.getCreatedAt());
        }
    }
    public record ActionDto(Long id, String admin, String actionType, String targetType, String targetId, String notes,
                            LocalDateTime at) {
        public static ActionDto from(AdminAction a) {
            return new ActionDto(a.getId(), a.getAdmin().getName(), a.getActionType(), a.getTargetType(), a.getTargetId(),
                    a.getNotes(), a.getCreatedAt());
        }
    }
}
