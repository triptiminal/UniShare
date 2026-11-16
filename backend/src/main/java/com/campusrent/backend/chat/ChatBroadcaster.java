package com.campusrent.backend.chat;

/** Publishes a saved message so every subscriber (on every server instance) receives it. */
public interface ChatBroadcaster {
    void publish(Long messageId);
}
