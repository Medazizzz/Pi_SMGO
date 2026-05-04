package com.example.contentmanagement.controller;

import com.example.contentmanagement.service.EmailSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email-scheduler")
@RequiredArgsConstructor
@Slf4j
public class EmailSchedulerController {

    private final EmailSchedulerService emailSchedulerService;

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerScheduledEmails() {
        log.info("Manual trigger for scheduled emails requested");
        try {
            emailSchedulerService.sendScheduledEmails();
            return ResponseEntity.ok("Scheduled emails triggered");
        } catch (Exception e) {
            log.error("Failed to trigger scheduled emails: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Failed to trigger scheduled emails: " + e.getMessage());
        }
    }
}
