package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.NotificationDTO;
import com.example.contentmanagement.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * REST endpoint for broadcasting notifications to all users.
 * Notifications sent here bypass individual user filtering and go to all users.
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationBroadcastController {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a notification to all users.
     * Stores in database AND sends via WebSocket to /topic/notifications for real-time delivery.
     *
     * @param notificationDTO Notification details (title, message, type)
     * @return Created notification with metadata
     */
    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcastNotification(@Valid @RequestBody NotificationDTO notificationDTO) {
        try {
            log.info("Broadcasting notification to all users: {}", notificationDTO.getTitle());

            // Set userId to null to indicate this is a broadcast
            notificationDTO.setUserId(null);

            // Save to database first
            NotificationDTO savedNotification = notificationService.createNotification(notificationDTO);

            // Prepare WebSocket message with timestamp
            Map<String, Object> broadcastMessage = new HashMap<>();
            broadcastMessage.put("id", savedNotification.getId());
            broadcastMessage.put("title", savedNotification.getTitle());
            broadcastMessage.put("message", savedNotification.getMessage());
            broadcastMessage.put("type", savedNotification.getType());
            broadcastMessage.put("createdAt", savedNotification.getCreatedAt());
            broadcastMessage.put("timestamp", System.currentTimeMillis());
            broadcastMessage.put("isBroadcast", true);

            // Send to all connected clients via WebSocket
            messagingTemplate.convertAndSend("/topic/notifications", broadcastMessage);

            log.info("Notification broadcasted successfully. ID: {}", savedNotification.getId());

            // Return response with confirmation
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedNotification.getId());
            response.put("title", savedNotification.getTitle());
            response.put("message", savedNotification.getMessage());
            response.put("status", "broadcasted");
            response.put("timestamp", System.currentTimeMillis());
            response.put("broadcastedToAllUsers", true);

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error broadcasting notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error broadcasting notification: " + e.getMessage());
        }
    }

    /**
     * Broadcast a quick test notification to all users.
     * Useful for verifying WebSocket connectivity.
     *
     * @return Test notification response
     */
    @PostMapping("/broadcast/test")
    public ResponseEntity<?> sendTestBroadcast() {
        try {
            log.info("Sending test broadcast notification");

            NotificationDTO testNotification = new NotificationDTO();
            testNotification.setTitle("Test Notification");
            testNotification.setMessage("This is a test broadcast notification sent to all users.");
            testNotification.setType("INFO");
            testNotification.setUserId(null);

            // Save to database
            NotificationDTO savedNotification = notificationService.createNotification(testNotification);

            // Prepare WebSocket message
            Map<String, Object> broadcastMessage = new HashMap<>();
            broadcastMessage.put("id", savedNotification.getId());
            broadcastMessage.put("title", "Test Notification");
            broadcastMessage.put("message", "This is a test broadcast notification sent to all users.");
            broadcastMessage.put("type", "INFO");
            broadcastMessage.put("timestamp", System.currentTimeMillis());
            broadcastMessage.put("isBroadcast", true);
            broadcastMessage.put("isTest", true);

            // Send to all connected clients via WebSocket
            messagingTemplate.convertAndSend("/topic/notifications", broadcastMessage);

            log.info("Test broadcast notification sent successfully");

            return ResponseEntity.ok("Test notification sent to all users");
        } catch (Exception e) {
            log.error("Error sending test broadcast: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error sending test broadcast: " + e.getMessage());
        }
    }
}