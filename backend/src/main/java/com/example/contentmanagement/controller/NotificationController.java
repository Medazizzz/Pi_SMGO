package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.NotificationDTO;
import com.example.contentmanagement.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> createNotification(@Valid @RequestBody NotificationDTO notificationDTO) {
        try {
            log.info("Creating notification for user: {}", notificationDTO.getUserId());
            NotificationDTO result = notificationService.createNotification(notificationDTO);
            log.info("Notification created successfully with ID: {}", result.getId());
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating notification: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllNotifications() {
        try {
            log.info("Fetching all notifications");
            List<NotificationDTO> result = notificationService.getAllNotifications();
            log.info("Retrieved {} notifications", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error fetching notifications: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getNotificationsByUserId(@PathVariable String userId) {
        try {
            log.info("Fetching notifications for user: {}", userId);
            List<NotificationDTO> result = notificationService.getNotificationsByUserId(userId);
            log.info("Retrieved {} notifications for user: {}", result.size(), userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching notifications for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error fetching notifications: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            log.info("Marking notification as read: {}", id);
            notificationService.markAsRead(id);
            log.info("Notification marked as read: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error marking notification as read: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error marking notification as read: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        try {
            log.info("Deleting notification: {}", id);
            notificationService.deleteNotification(id);
            log.info("Notification deleted: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error deleting notification: " + e.getMessage());
        }
    }
}
