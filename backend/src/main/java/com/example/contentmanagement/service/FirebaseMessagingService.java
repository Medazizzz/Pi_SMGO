package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.NotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Firebase Messaging Service - DÉSACTIVÉE TEMPORAIREMENT
 * Pour réactiver : restaurer les imports Firebase et le contenu des méthodes
 */
@Service
@Slf4j
public class FirebaseMessagingService {

    public void sendPushNotification(String token, NotificationDTO notification) {
        log.debug("Firebase désactivé - sendPushNotification ignoré");
    }

    public void sendPushNotificationToMultipleTokens(List<String> tokens, NotificationDTO notification) {
        log.debug("Firebase désactivé - sendPushNotificationToMultipleTokens ignoré");
    }

    public void sendBroadcastNotification(NotificationDTO notification) {
        log.debug("Firebase désactivé - sendBroadcastNotification ignoré");
    }

    public void subscribeToBroadcastTopic(String token) {
        log.debug("Firebase désactivé - subscribeToBroadcastTopic ignoré");
    }

    public void unsubscribeFromBroadcastTopic(String token) {
        log.debug("Firebase désactivé - unsubscribeFromBroadcastTopic ignoré");
    }
}