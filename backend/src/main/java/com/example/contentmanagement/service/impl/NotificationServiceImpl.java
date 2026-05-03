package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.NotificationDTO;
import com.example.contentmanagement.entity.Notification;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.NotificationRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.FirebaseMessagingService;
import com.example.contentmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final FirebaseMessagingService firebaseMessagingService;

    @Value("${app.notifications.email-fallback-delay-seconds:300}")
    private long emailFallbackDelaySeconds;

    @Value("${app.notifications.email-fallback-enabled:true}")
    private boolean emailFallbackEnabled;

    @Value("${app.notifications.email-from:no-reply@smgo.local}")
    private String fromEmail;

    @Override
    @Transactional
    public NotificationDTO createNotification(NotificationDTO notificationDTO) {
        try {
            log.info("Creating notification for user: {}", notificationDTO.getUserId());

            // If userId is null, this is a broadcast to all users
            if (notificationDTO.getUserId() == null || notificationDTO.getUserId().isEmpty()) {
                log.info("Broadcast notification detected - creating for all users");
                return createBroadcastNotification(notificationDTO);
            }

            // Single user notification
            User user = userRepository.findById(notificationDTO.getUserId())
                    .orElseGet(() -> createAnonymousUserForNotification(notificationDTO.getUserId()));

            Notification notification = Notification.builder()
                    .message(notificationDTO.getMessage())
                    .title(notificationDTO.getTitle())
                    .type(notificationDTO.getType())
                    .createdAt(LocalDateTime.now())
                    .emailFallbackDueAt(LocalDateTime.now().plusSeconds(emailFallbackDelaySeconds))
                    .isRead(false)
                    .emailFallbackSent(false)
                    .user(user)
                    .build();

            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification saved successfully with ID: {}", savedNotification.getId());

            // Send push notification via Firebase if user has device tokens
            if (user.getDeviceTokens() != null && !user.getDeviceTokens().isEmpty()) {
                firebaseMessagingService.sendPushNotificationToMultipleTokens(
                        user.getDeviceTokens(), mapToDTO(savedNotification));
                log.info("Push notification sent to {} device tokens for user {}", user.getDeviceTokens().size(), user.getId());
            }

            return mapToDTO(savedNotification);
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create notification: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a broadcast notification for all users in the system.
     * This method creates individual notification records for each user.
     */
    @Transactional
    private NotificationDTO createBroadcastNotification(NotificationDTO notificationDTO) {
        try {
            log.info("Creating broadcast notification for all users");

            // Get all users from the database
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found in database for broadcast notification");
                throw new RuntimeException("No users found to broadcast to");
            }

            log.info("Broadcasting to {} users", allUsers.size());

            // Create notifications for each user
            List<Notification> broadcastNotifications = allUsers.stream()
                    .map(user -> Notification.builder()
                            .message(notificationDTO.getMessage())
                            .title(notificationDTO.getTitle())
                            .type(notificationDTO.getType())
                            .createdAt(LocalDateTime.now())
                            .emailFallbackDueAt(LocalDateTime.now().plusSeconds(emailFallbackDelaySeconds))
                            .isRead(false)
                            .emailFallbackSent(false)
                            .user(user)
                            .build())
                    .toList();

            // Save all notifications
            List<Notification> savedNotifications = notificationRepository.saveAll(broadcastNotifications);
            log.info("Broadcast notification created for {} users", savedNotifications.size());

            // Send broadcast push notification via Firebase
            firebaseMessagingService.sendBroadcastNotification(notificationDTO);
            log.info("Broadcast push notification sent via Firebase");

            // Return the first notification as representative (they all have the same content)
            return mapToDTO(savedNotifications.get(0));
        } catch (Exception e) {
            log.error("Error creating broadcast notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create broadcast notification: " + e.getMessage(), e);
        }
    }

    @Override
    public List<NotificationDTO> getNotificationsByUserId(String userId) {
        return notificationRepository.findByUser_Id(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setIsRead(true);
        notification.setEmailFallbackSent(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void deleteNotification(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notificationRepository.delete(notification);
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        if (!isDeliverableEmail(to)) {
            log.warn("Skipping email send because recipient is not deliverable: {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, "SMGO admin");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send email to " + to, ex);
        }
        log.info("Email sent successfully to {}", to);
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("Sending SMS to: {}, Message: {}", phoneNumber, message);
        // Structure for real API integration
    }

    @Scheduled(fixedDelayString = "${app.notifications.email-fallback-check-interval-ms:10000}")
    @Transactional
    public void processUnreadNotificationEmailFallback() {
        log.info("Notification fallback scheduler triggered at {}", LocalDateTime.now());
        int processed = processEmailFallbackNow();
        log.info("Notification fallback scheduler completed: {} email fallback(s) processed", processed);
    }

    @Override
    @Transactional
    public int processEmailFallbackNow() {
        if (!emailFallbackEnabled) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Notification> pending = notificationRepository
                .findByIsReadFalseAndEmailFallbackSentFalseAndEmailFallbackDueAtLessThanEqual(now);

        if (pending.isEmpty()) {
            return 0;
        }

        int processed = 0;

        for (Notification notification : pending) {
            String email = notification.getUser() != null ? notification.getUser().getEmail() : null;
            if (!isDeliverableEmail(email)) {
                notification.setEmailFallbackSent(true);
                notification.setEmailFallbackSentAt(now);
                notificationRepository.save(notification);
                processed++;
                continue;
            }

            String subject = notification.getTitle() != null && !notification.getTitle().isBlank()
                    ? notification.getTitle()
                    : "SMGO Notification";
            try {
                sendEmail(email, subject, notification.getMessage());
                notification.setEmailFallbackSent(true);
                notification.setEmailFallbackSentAt(now);
                notificationRepository.save(notification);
                processed++;
            } catch (Exception ex) {
                log.error("Failed to send fallback email for notification {}: {}", notification.getId(), ex.getMessage(), ex);
            }
        }

        return processed;
    }

    private User createAnonymousUserForNotification(String identifier) {
        try {
            User newUser = new User();
            newUser.setUsername(identifier);
            newUser.setEmail(identifier + "@system.local");
            newUser.setPassword("system-password");
            newUser.setEnabled(true);
            log.info("Created anonymous user for notification: {}", identifier);
            return userRepository.save(newUser);
        } catch (Exception e) {
            log.error("Error creating anonymous user: {}", e.getMessage());
            // Return a minimal user object instead of failing
            User fallbackUser = userRepository.findByUsername("system")
                    .orElseGet(() -> {
                        User sysUser = new User();
                        sysUser.setUsername("system");
                        sysUser.setEmail("system@system.local");
                        sysUser.setPassword("system-password");
                        sysUser.setEnabled(true);
                        return userRepository.save(sysUser);
                    });
            return fallbackUser;
        }
    }

    private boolean isDeliverableEmail(String email) {
        return email != null && !email.isBlank() && !email.endsWith("@system.local");
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .title(notification.getTitle())
                .type(notification.getType())
                .createdAt(notification.getCreatedAt())
                .isRead(notification.getIsRead())
                .userId(notification.getUser().getId())
                .username(notification.getUser().getUsername())
                .build();
    }
}
