package com.campusrent.backend.chat;

import com.campusrent.backend.dto.Dtos.MessageDto;
import com.campusrent.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads a saved message and pushes it to the STOMP topic of its booking on THIS server instance. */
@Service
@RequiredArgsConstructor
public class ChatDelivery {
    private final ChatMessageRepository messages;
    private final SimpMessagingTemplate template;

    @Transactional(readOnly = true)
    public void deliver(Long messageId) {
        messages.findById(messageId).ifPresent(m ->
                template.convertAndSend("/topic/booking." + m.getBooking().getId(), MessageDto.from(m)));
    }
}
