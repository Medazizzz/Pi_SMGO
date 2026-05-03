package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.NotificationDTO;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Firebase Messaging Service
 * WHY: Handles push notifications via Firebase Cloud Messaging
 * Sends notifications to mobile/web clients when in-app notifications are sent
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseMessagingService {

    private final FirebaseMessaging firebaseMessaging;

    @Value("${firebase.messaging.enabled:true}")
    private boolean messagingEnabled;

    /**
     * Send push notification to a single device
     */
    public void sendPushNotification(String token, NotificationDTO notification) {
        if (!messagingEnabled || firebaseMessaging == null) {
            log.debug("Firebase messaging is disabled or not configured");
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(notification.getTitle())
                            .setBody(notification.getMessage())
                            .build())
                    .putData("notificationId", notification.getId() != null ? notification.getId() : "")
                    .putData("type", notification.getType() != null ? notification.getType() : "info")
                    .putData("userId", notification.getUserId() != null ? notification.getUserId() : "")
                    .build();

            String response = firebaseMessaging.send(message);
            log.info("Push notification sent successfully to token. Response: {}", response);

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send push notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send push notification to multiple devices
     */
    public void sendPushNotificationToMultipleTokens(List<String> tokens, NotificationDTO notification) {
        if (!messagingEnabled || firebaseMessaging == null) {
            log.debug("Firebase messaging is disabled or not configured");
            return;
        }

        if (tokens == null || tokens.isEmpty()) {
            log.debug("No tokens provided for push notification");
            return;
        }

        try {
            MulticastMessage message = MulticastMessage.builder()
                    .addAllTokens(tokens)
                    .setNotification(Notification.builder()
                            .setTitle(notification.getTitle())
                            .setBody(notification.getMessage())
                            .build())
                    .putData("notificationId", notification.getId() != null ? notification.getId() : "")
                    .putData("type", notification.getType() != null ? notification.getType() : "info")
                    .putData("userId", notification.getUserId() != null ? notification.getUserId() : "")
                    .build();

            BatchResponse response = firebaseMessaging.sendMulticast(message);
            log.info("Multicast push notification sent. Success count: {}, Failure count: {}",
                    response.getSuccessCount(), response.getFailureCount());

            // Log failures for debugging
            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        log.warn("Failed to send to token {}: {}", tokens.get(i),
                                responses.get(i).getException().getMessage());
                    }
                }
            }

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send multicast push notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send broadcast notification to topic (for system-wide announcements)
     */
    public void sendBroadcastNotification(NotificationDTO notification) {
        if (!messagingEnabled || firebaseMessaging == null) {
            log.debug("Firebase messaging is disabled or not configured");
            return;
        }

        try {
            Message message = Message.builder()
                    .setTopic("broadcast")
                    .setNotification(Notification.builder()
                            .setTitle(notification.getTitle())
                            .setBody(notification.getMessage())
                            .build())
                    .putData("notificationId", notification.getId() != null ? notification.getId() : "")
                    .putData("type", notification.getType() != null ? notification.getType() : "broadcast")
                    .putData("isBroadcast", "true")
                    .build();

            String response = firebaseMessaging.send(message);
            log.info("Broadcast push notification sent to topic. Response: {}", response);

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send broadcast push notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Subscribe device token to broadcast topic
     */
    public void subscribeToBroadcastTopic(String token) {
        if (!messagingEnabled || firebaseMessaging == null) {
            log.debug("Firebase messaging is disabled or not configured");
            return;
        }

        try {
            TopicManagementResponse response = firebaseMessaging.subscribeToTopic(
                    List.of(token), "broadcast");
            log.info("Token subscribed to broadcast topic. Success count: {}", response.getSuccessCount());

        } catch (FirebaseMessagingException e) {
            log.error("Failed to subscribe token to broadcast topic: {}", e.getMessage(), e);
        }
    }

    /**
     * Unsubscribe device token from broadcast topic
     */
    public void unsubscribeFromBroadcastTopic(String token) {
        if (!messagingEnabled || firebaseMessaging == null) {
            log.debug("Firebase messaging is disabled or not configured");
            return;
        }

        try {
            TopicManagementResponse response = firebaseMessaging.unsubscribeFromTopic(
                    List.of(token), "broadcast");
            log.info("Token unsubscribed from broadcast topic. Success count: {}", response.getSuccessCount());

        } catch (FirebaseMessagingException e) {
            log.error("Failed to unsubscribe token from broadcast topic: {}", e.getMessage(), e);
        }
    }
}