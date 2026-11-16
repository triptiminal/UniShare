package com.campusrent.backend.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Dev implementation: prints the email to the console. Swap for a JavaMailSender-based bean for real delivery. */
@Slf4j
@Component
public class LoggingEmailSender implements EmailSender {
    @Override
    public void send(String to, String subject, String body) {
        log.info("\n--- EMAIL to {} ---\n{}\n{}\n-------------------", to, subject, body);
    }
}
