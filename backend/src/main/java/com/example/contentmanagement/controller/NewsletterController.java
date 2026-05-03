package com.example.contentmanagement.controller;

import com.example.contentmanagement.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Newsletter Controller
 * WHY: Provides endpoints for newsletter management
 * Allows users to trigger newsletters and admins to send monthly campaigns
 */
@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
@Slf4j
public class NewsletterController {

    private final NewsletterService newsletterService;

    /**
     * Send monthly newsletter to all users (Admin only)
     */
    @PostMapping("/send-monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendMonthlyNewsletter() {
        try {
            log.info("Admin triggered monthly newsletter");
            newsletterService.sendMonthlyNewsletter();
            return ResponseEntity.ok("Monthly newsletter sent successfully");
        } catch (Exception e) {
            log.error("Failed to send monthly newsletter: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("Failed to send monthly newsletter: " + e.getMessage());
        }
    }

    /**
     * Send newsletter to current user
     */
    @PostMapping("/send-to-me")
    public ResponseEntity<String> sendNewsletterToCurrentUser(@RequestParam String userId) {
        try {
            log.info("User {} requested newsletter", userId);
            newsletterService.sendNewsletterToUser(userId);
            return ResponseEntity.ok("Newsletter sent to your email successfully");
        } catch (Exception e) {
            log.error("Failed to send newsletter to user {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body("Failed to send newsletter: " + e.getMessage());
        }
    }

    /**
     * Get newsletter status/configuration
     */
    @GetMapping("/status")
    public ResponseEntity<NewsletterStatus> getNewsletterStatus() {
        NewsletterStatus status = new NewsletterStatus();
        status.setEnabled(true); // Could be made configurable
        status.setDescription("Monthly newsletter with personalized AI recommendations");
        return ResponseEntity.ok(status);
    }

    /**
     * Newsletter status DTO
     */
    public static class NewsletterStatus {
        private boolean enabled;
        private String description;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}