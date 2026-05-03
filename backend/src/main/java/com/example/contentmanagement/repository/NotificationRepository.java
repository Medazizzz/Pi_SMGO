package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUser_Id(String userId);
    List<Notification> findByIsReadFalseAndEmailFallbackSentFalseAndEmailFallbackDueAtLessThanEqual(LocalDateTime now);
}
