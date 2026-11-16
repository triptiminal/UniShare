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
@RequestMapping("/api/bookings/{bookingId}/messages")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chat;

    @GetMapping public List<MessageDto> history(@PathVariable Long bookingId) { return chat.history(CurrentUser.id(), bookingId); }

    /** REST fallback; the realtime path is STOMP: SEND /app/booking/{id}/send, SUBSCRIBE /topic/booking.{id}. */
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public MessageDto send(@PathVariable Long bookingId, @Valid @RequestBody MessageRequest r) { return chat.send(CurrentUser.id(), bookingId, r.content()); }
}
