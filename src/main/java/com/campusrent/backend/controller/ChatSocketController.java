package com.campusrent.backend.controller;

import com.campusrent.backend.chat.StompAuthInterceptor;
import com.campusrent.backend.dto.Dtos.MessageRequest;
import com.campusrent.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatSocketController {
    private final ChatService chat;

    @MessageMapping("/booking/{bookingId}/send")
    public void send(@DestinationVariable Long bookingId, @Payload MessageRequest req, Principal principal) {
        chat.send(StompAuthInterceptor.userId(principal), bookingId, req.content());
    }
}
