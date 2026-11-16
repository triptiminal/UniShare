package com.campusrent.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name = "chat_messages") @Getter @Setter @NoArgsConstructor
public class ChatMessage extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @ManyToOne(optional = false) @JoinColumn(name = "sender_id") private User sender;
    @Column(nullable = false, length = 2000) private String content;
}
