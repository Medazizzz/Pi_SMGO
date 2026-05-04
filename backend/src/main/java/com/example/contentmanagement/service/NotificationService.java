package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.NotificationDTO;
import java.util.List;

public interface NotificationService {
    NotificationDTO createNotification(NotificationDTO notificationDTO);
    List<NotificationDTO> getAllNotifications();
    List<NotificationDTO> getNotificationsByUserId(String userId);
    void markAsRead(String id);
    void deleteNotification(String id);
    
    // External notification structure
    void sendEmail(String to, String subject, String body);
    void sendSms(String phoneNumber, String message);
}
