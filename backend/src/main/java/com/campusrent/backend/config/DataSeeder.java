package com.campusrent.backend.config;

import com.campusrent.backend.entity.College;
import com.campusrent.backend.entity.User;
import com.campusrent.backend.repository.CollegeRepository;
import com.campusrent.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** Admins are never created via public sign-up: this seeds the first one directly into the database. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final CollegeRepository colleges;
    private final PasswordEncoder encoder;

    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;

    @Override
    public void run(String... args) {
        if (!colleges.existsByEmailDomain("medicaps.ac.in")) {
            seedCollege("Medi-Caps University", "medicaps.ac.in", "Indore");
        }
        if (!users.existsByEmail(adminEmail)) {
            User a = new User();
            a.setName("CampusRent Admin");
            a.setEmail(adminEmail);
            a.setPasswordHash(encoder.encode(adminPassword));
            a.setRole(User.Role.ADMIN);
            a.setVerificationStatus(User.VerificationStatus.VERIFIED);
            a.setVerifiedAt(LocalDateTime.now());
            users.save(a);
            log.warn("Seeded admin account {} - change its password before deploying", adminEmail);
        }
    }

    private void seedCollege(String name, String domain, String campus) {
        College c = new College();
        c.setName(name);
        c.setEmailDomain(domain);
        c.setCampus(campus);
        colleges.save(c);
    }
}
