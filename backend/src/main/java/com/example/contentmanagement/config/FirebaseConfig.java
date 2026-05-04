package com.example.contentmanagement.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.lang.Nullable;

import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Configuration
 * WHY: Enables Firebase Cloud Messaging for push notifications
 * Handles Firebase app initialization and messaging client setup
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.project-id:smgo-notifications}")
    private String projectId;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.database-url:}")
    private String databaseUrl;

    @Value("${firebase.messaging.enabled:true}")
    private boolean messagingEnabled;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!messagingEnabled) {
            log.info("Firebase messaging is disabled");
            return null;
        }

        log.info("Initializing Firebase app with project ID: {}", projectId);

        FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                .setProjectId(projectId);

        // Try to load service account from file path first
        if (serviceAccountPath != null && !serviceAccountPath.trim().isEmpty()) {
            try {
                log.info("Loading Firebase service account from file: {}", serviceAccountPath);
                optionsBuilder.setCredentials(GoogleCredentials.fromStream(
                        new ClassPathResource(serviceAccountPath).getInputStream()));
            } catch (Exception e) {
                log.warn("Failed to load service account from classpath, trying file system: {}", e.getMessage());
                try {
                    optionsBuilder.setCredentials(GoogleCredentials.fromStream(
                            new java.io.FileInputStream(serviceAccountPath)));
                } catch (Exception e2) {
                    log.error("Failed to load Firebase service account: {}", e2.getMessage());
                    log.warn("Firebase will be disabled - credentials not available");
                    return null;
                }
            }
        } else {
            // Use Application Default Credentials (for GCP environments)
            log.info("Using Application Default Credentials for Firebase");
            try {
                optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
            } catch (IOException e) {
                log.warn("Firebase credentials not found - Firebase messaging will be disabled. To enable, set up Google Cloud credentials.");
                return null;
            }
        }

        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            optionsBuilder.setDatabaseUrl(databaseUrl);
        }

        FirebaseOptions options = optionsBuilder.build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp app = FirebaseApp.initializeApp(options);
            log.info("Firebase app initialized successfully");
            return app;
        } else {
            log.info("Firebase app already initialized");
            return FirebaseApp.getInstance();
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging(@Nullable FirebaseApp firebaseApp) {
        if (!messagingEnabled || firebaseApp == null) {
            log.info("Firebase messaging bean not created (disabled or no app)");
            return null;
        }

        try {
            FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
            log.info("Firebase messaging client initialized");
            return messaging;
        } catch (Exception e) {
            log.warn("Failed to initialize Firebase messaging: {}", e.getMessage());
            return null;
        }
    }
}