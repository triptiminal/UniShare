package com.campusrent.backend.service;

import com.campusrent.backend.common.*;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final CollegeRepository colleges;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final com.campusrent.backend.security.JwtService jwt;

    @Value("${app.jwt.refresh-token-ms}")
    private long refreshMs;
    @Value("${app.allowed-email-domain}")
    private String allowedDomain;

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (!email.endsWith("@" + allowedDomain))                                   // NEW
            throw ApiException.badRequest("Only @" + allowedDomain + " email addresses can register");  // NEW
        if (users.existsByEmail(email)) throw ApiException.conflict("An account with this email already exists");
        College college = colleges.findById(r.collegeId()).orElseThrow(() -> ApiException.badRequest("Unknown college"));
        if (!college.getEmailDomain().equalsIgnoreCase(allowedDomain))              // NEW
            throw ApiException.badRequest("Please select your college from the list");  // NEW
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setPhone(r.phone());
        u.setCollege(college);
        u.setCollegeIdNumber(r.collegeIdNumber());
        return issue(users.save(u));
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (u.isSuspended()) throw ApiException.forbidden("This account has been suspended");
        return issue(u);
    }

    /** Rotating refresh tokens: each use revokes the old token and issues a new pair. */
    @Transactional
    public AuthResponse refresh(String raw) {
        RefreshToken t = refreshTokens.findByTokenHashAndRevokedFalse(Crypto.sha256Hex(raw))
                .filter(x -> x.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> ApiException.unauthorized("Refresh token is invalid or expired"));
        t.setRevoked(true);
        if (t.getUser().isSuspended()) throw ApiException.forbidden("This account has been suspended");
        return issue(t.getUser());
    }

    @Transactional
    public void logout(String raw) {
        refreshTokens.findByTokenHashAndRevokedFalse(Crypto.sha256Hex(raw)).ifPresent(t -> t.setRevoked(true));
    }

    private AuthResponse issue(User u) {
        String raw = Crypto.randomToken();
        RefreshToken t = new RefreshToken();
        t.setUser(u);
        t.setTokenHash(Crypto.sha256Hex(raw));
        t.setExpiresAt(LocalDateTime.now().plusSeconds(refreshMs / 1000));
        refreshTokens.save(t);
        return new AuthResponse(jwt.accessToken(u), raw, UserDto.from(u));
    }
}
