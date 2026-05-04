package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUser_Id(String userId);
}
