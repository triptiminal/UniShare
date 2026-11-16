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
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository messages;
    private final BookingService bookingService;
    private final UserService users;
    private final com.campusrent.backend.chat.ChatBroadcaster broadcaster;

    /** Chat is scoped to a booking: only its owner and renter can read or write. */
    @Transactional
    public MessageDto send(Long userId, Long bookingId, String content) {
        Booking b = bookingService.load(bookingId);
        if (!bookingService.isParticipant(b, userId)) throw ApiException.forbidden("You're not part of this booking");
        if (b.getStatus() == Booking.Status.DECLINED || b.getStatus() == Booking.Status.CANCELLED)
            throw ApiException.badRequest("Chat is closed for this booking");
        ChatMessage m = new ChatMessage();
        m.setBooking(b);
        m.setSender(users.get(userId));
        m.setContent(content.trim());
        m = messages.save(m);
        Long id = m.getId();
        // publish only after the commit so other instances can read the row
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override public void afterCommit() { broadcaster.publish(id); }
                });
        return MessageDto.from(m);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> history(Long userId, Long bookingId) {
        Booking b = bookingService.load(bookingId);
        if (!bookingService.isParticipant(b, userId) && !CurrentUser.isAdmin()) throw ApiException.forbidden("You're not part of this booking");
        return messages.findByBooking_IdOrderByIdAsc(bookingId).stream().map(MessageDto::from).toList();
    }
}
