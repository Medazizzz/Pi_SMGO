package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * Independent Email Scheduler Service
 * WHY: Handles scheduled emails independent of notification system
 * Sends varied emails to different users at different times
 * Separate from notification fallback system
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSchedulerService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.email-scheduler.enabled:true}")
    private boolean emailSchedulerEnabled;

    @Value("${app.email-scheduler.from:no-reply@smgo.local}")
    private String fromEmail;

    @Value("${app.email-scheduler.subject-prefix:SMGO - }")
    private String subjectPrefix;

    private final Random random = new Random();

    /**
     * Scheduled task to send varied emails to random users
     * Runs every 2 minutes (120000 ms) with random delay
     */
    @Scheduled(fixedDelayString = "${app.email-scheduler.interval-ms:120000}")
    public void sendScheduledEmails() {
        if (!emailSchedulerEnabled) {
            log.debug("Email scheduler is disabled");
            return;
        }

        try {
            log.info("Email scheduler triggered at {}", LocalDateTime.now());

            // Get all users
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found for scheduled emails");
                return;
            }

            // Select random users (up to 3 per run)
            int emailCount = Math.min(3, allUsers.size());
            List<User> selectedUsers = selectRandomUsers(allUsers, emailCount);

            int sentCount = 0;
            for (User user : selectedUsers) {
                if (isDeliverableEmail(user.getEmail())) {
                    try {
                        sendVariedEmail(user);
                        sentCount++;
                        // Add random delay between emails (1-5 seconds)
                        Thread.sleep(1000 + random.nextInt(4000));
                    } catch (Exception e) {
                        log.error("Failed to send scheduled email to {}: {}", user.getEmail(), e.getMessage());
                    }
                }
            }

            log.info("Email scheduler completed: {} emails sent to {} users", sentCount, selectedUsers.size());

        } catch (Exception e) {
            log.error("Error in email scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Send a varied email to a specific user
     */
    public void sendVariedEmail(User user) {
        String[] subjects = {
            "Check out our latest content!",
            "Don't miss these recommendations",
            "New features available",
            "Your personalized suggestions",
            "Explore trending content"
        };

        String[] messages = {
            "Hi " + user.getFirstName() + ", we have some amazing new content just for you. Check it out in the app!",
            "Hello " + user.getFirstName() + ", based on your interests, we've curated some content you might enjoy.",
            user.getFirstName() + ", discover the latest trending movies and series in our collection.",
            "Personalized recommendations are ready for you, " + user.getFirstName() + ". Open the app to see them!",
            user.getFirstName() + ", we've updated our content library with fresh titles. Come take a look!"
        };

        String subject = subjectPrefix + subjects[random.nextInt(subjects.length)];
        String message = messages[random.nextInt(messages.length)];

        sendEmail(user.getEmail(), subject, message);
    }

    /**
     * Send email to specific recipient with custom content
     */
    public void sendCustomEmail(String to, String subject, String body) {
        if (!isDeliverableEmail(to)) {
            log.warn("Skipping email send because recipient is not deliverable: {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, "SMGO Team");
            helper.setTo(to);
            helper.setSubject(subjectPrefix + subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("Custom email sent successfully to {}", to);
        } catch (Exception ex) {
            log.error("Failed to send custom email to {}: {}", to, ex.getMessage());
            throw new IllegalStateException("Failed to send custom email to " + to, ex);
        }
    }

    /**
     * Select random users from the list
     */
    private List<User> selectRandomUsers(List<User> users, int count) {
        if (users.size() <= count) {
            return users;
        }

        // Shuffle and take first 'count' users
        List<User> shuffled = new java.util.ArrayList<>(users);
        java.util.Collections.shuffle(shuffled, random);
        return shuffled.subList(0, count);
    }

    /**
     * Check if email is deliverable
     */
    private boolean isDeliverableEmail(String email) {
        return email != null && !email.isBlank() && !email.endsWith("@system.local");
    }

    /**
     * Send basic email
     */
    private void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, "SMGO Team");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send email to " + to, ex);
        }
    }
}