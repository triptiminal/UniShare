package com.campusrent.backend.integration;

public interface EmailSender {
    void send(String to, String subject, String body);
}
