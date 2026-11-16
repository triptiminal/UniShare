package com.campusrent.backend.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Single-instance mode (default): deliver directly. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.chat.redis-enabled", havingValue = "false", matchIfMissing = true)
public class LocalChatBroadcaster implements ChatBroadcaster {
    private final ChatDelivery delivery;

    @Override
    public void publish(Long messageId) { delivery.deliver(messageId); }
}
