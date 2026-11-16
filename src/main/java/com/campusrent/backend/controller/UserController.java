package com.campusrent.backend.controller;

import com.campusrent.backend.common.CurrentUser;
import com.campusrent.backend.dto.Dtos.*;
import com.campusrent.backend.entity.*;
import com.campusrent.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class UserController {
    private final UserService users;
    private final VerificationService verification;
    private final com.campusrent.backend.repository.CollegeRepository colleges;
    private final UploadService uploads;

    @GetMapping("/api/users/me")
    public UserDto me() { return users.me(CurrentUser.id()); }

    @PutMapping("/api/users/me")
    public UserDto update(@RequestBody UpdateProfileRequest r) { return users.update(CurrentUser.id(), r); }

    @GetMapping("/api/public/users/{id}")
    public PublicProfile profile(@PathVariable Long id) { return users.publicProfile(id); }

    @GetMapping("/api/colleges")
    public List<CollegeDto> colleges() { return colleges.findAll().stream().map(CollegeDto::from).toList(); }

    // --- college verification ---
    @PostMapping("/api/verification/otp") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendOtp() { verification.sendOtp(CurrentUser.id()); }

    @PostMapping("/api/verification/otp/confirm") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@Valid @RequestBody OtpConfirmRequest r) { verification.confirmOtp(CurrentUser.id(), r.code()); }

    @PostMapping("/api/verification/id") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submitId(@Valid @RequestBody IdSubmitRequest r) { verification.submitId(CurrentUser.id(), r.docUrl()); }

    // --- Cloudinary signed-upload parameters ---
    @GetMapping("/api/uploads/signature")
    public Map<String, Object> signature(@RequestParam String folder) { return uploads.sign(folder); }
}
