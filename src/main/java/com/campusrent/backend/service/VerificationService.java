package com.campusrent.backend.service;

import com.campusrent.backend.common.*;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VerificationService {
    private final UserRepository users;
    private final VerificationOtpRepository otps;
    private final com.campusrent.backend.integration.EmailSender email;
    private final UploadService uploads;
    private final NotificationService notifier;

    /** Path 1: email OTP. Only works if the user's email domain matches their college's domain. */
    @Transactional
    public void sendOtp(Long userId) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getVerificationStatus() == User.VerificationStatus.VERIFIED) throw ApiException.badRequest("Already verified");
        if (!domainMatches(u)) throw ApiException.badRequest(
                "Your email isn't a " + u.getCollege().getName() + " address. Submit your college ID instead.");
        otps.findByUser_IdAndUsedFalse(userId).forEach(o -> o.setUsed(true));
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        VerificationOtp o = new VerificationOtp();
        o.setUser(u);
        o.setCodeHash(Crypto.sha256Hex(userId + ":" + code));
        o.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otps.save(o);
        email.send(u.getEmail(), "Your CampusRent verification code", "Your code is " + code + ". It expires in 10 minutes.");
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void confirmOtp(Long userId, String code) {
        VerificationOtp o = otps.findFirstByUser_IdAndUsedFalseOrderByIdDesc(userId)
                .orElseThrow(() -> ApiException.badRequest("Request a new code first"));
        if (o.getExpiresAt().isBefore(LocalDateTime.now()) || o.getAttempts() >= 5) {
            o.setUsed(true);
            throw ApiException.badRequest("Code expired or too many attempts. Request a new one.");
        }
        if (!Crypto.safeEquals(o.getCodeHash(), Crypto.sha256Hex(userId + ":" + code.trim()))) {
            o.setAttempts(o.getAttempts() + 1);
            throw ApiException.badRequest("Incorrect code");
        }
        o.setUsed(true);
        User u = o.getUser();
        u.setVerificationStatus(User.VerificationStatus.VERIFIED);
        u.setVerifiedAt(LocalDateTime.now());
        notifier.notify(userId, "VERIFIED", "Your college verification is complete.", null);
    }

    /** Path 2: upload a college ID photo; an admin approves it. */
    @Transactional
    public void submitId(Long userId, String docUrl) {
        uploads.assertAllowedUrl(docUrl);
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getVerificationStatus() == User.VerificationStatus.VERIFIED) throw ApiException.badRequest("Already verified");
        u.setVerificationDocUrl(docUrl);
        u.setVerificationStatus(User.VerificationStatus.PENDING);
        notifier.notifyAdmins("VERIFICATION_REVIEW", u.getName() + " submitted a college ID for review.", null);
    }

    private boolean domainMatches(User u) {
        if (u.getCollege() == null) return false;
        String domain = u.getEmail().substring(u.getEmail().indexOf('@') + 1).toLowerCase();
        String cd = u.getCollege().getEmailDomain().toLowerCase();
        return domain.equals(cd) || domain.endsWith("." + cd);
    }
}
