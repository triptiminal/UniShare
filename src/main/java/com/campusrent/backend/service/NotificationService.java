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
public class NotificationService {
    private final NotificationRepository repo;
    private final UserRepository users;

    @Transactional
    public void notify(Long userId, String type, String message, Long bookingId) {
        Notification n = new Notification();
        n.setUser(users.getReferenceById(userId));
        n.setType(type);
        n.setMessage(message);
        n.setBookingId(bookingId);
        repo.save(n);
    }

    @Transactional
    public void notifyAdmins(String type, String message, Long bookingId) {
        users.findByRole(User.Role.ADMIN).forEach(a -> notify(a.getId(), type, message, bookingId));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> mine(Long userId) {
        return repo.findTop100ByUser_IdOrderByIdDesc(userId).stream().map(NotificationDto::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) { return repo.countByUser_IdAndSeenFalse(userId); }

    @Transactional
    public void markRead(Long userId, Long id) {
        repo.findById(id).filter(n -> n.getUser().getId().equals(userId)).ifPresent(n -> n.setSeen(true));
    }

    @Transactional
    public void markAllRead(Long userId) { repo.findByUser_IdAndSeenFalse(userId).forEach(n -> n.setSeen(true)); }
}
