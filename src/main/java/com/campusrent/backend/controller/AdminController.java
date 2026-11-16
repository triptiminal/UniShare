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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService admin;
    private final SettlementService settlement;

    @GetMapping("/stats") public Map<String, Object> stats() { return admin.stats(); }

    // --- users ---
    @GetMapping("/users")
    public PageDto<UserDto> users(@RequestParam(required = false) User.VerificationStatus status, @RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return admin.users(status, q, page, size);
    }
    @PostMapping("/users/{id}/verify") public UserDto verify(@PathVariable Long id) { return admin.verifyUser(CurrentUser.id(), id); }
    @PostMapping("/users/{id}/reject")
    public UserDto reject(@PathVariable Long id, @RequestBody(required = false) ReasonRequest r) { return admin.rejectUser(CurrentUser.id(), id, r == null ? null : r.reason()); }
    @PostMapping("/users/{id}/suspend")
    public UserDto suspend(@PathVariable Long id, @RequestBody(required = false) ReasonRequest r) { return admin.suspend(CurrentUser.id(), id, true, r == null ? null : r.reason()); }
    @PostMapping("/users/{id}/unsuspend") public UserDto unsuspend(@PathVariable Long id) { return admin.suspend(CurrentUser.id(), id, false, null); }

    // --- listings ---
    @GetMapping("/listings")
    public PageDto<ListingDto> listings(@RequestParam(defaultValue = "false") boolean flagged, @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) { return admin.listings(flagged, page, size); }
    /** action = flag | unflag | archive */
    @PostMapping("/listings/{id}/{action}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moderate(@PathVariable String id, @PathVariable String action, @RequestBody(required = false) ReasonRequest r) {
        admin.moderateListing(CurrentUser.id(), id, action, r == null ? null : r.reason());
    }

    // --- disputes ---
    @GetMapping("/disputes") public List<BookingDto> disputes() { return settlement.openDisputes(); }
    @GetMapping("/disputes/{bookingId}") public DisputeDetail dispute(@PathVariable Long bookingId) { return admin.dispute(bookingId); }
    @PostMapping("/disputes/{bookingId}/resolve")
    public BookingDto resolve(@PathVariable Long bookingId, @Valid @RequestBody ResolveRequest r) { return settlement.resolve(CurrentUser.id(), bookingId, r); }

    // --- colleges & audit log ---
    @PostMapping("/colleges") @ResponseStatus(HttpStatus.CREATED)
    public CollegeDto addCollege(@Valid @RequestBody CollegeRequest r) { return admin.addCollege(r); }
    @GetMapping("/actions") public List<ActionDto> actions() { return admin.actions(); }
}
