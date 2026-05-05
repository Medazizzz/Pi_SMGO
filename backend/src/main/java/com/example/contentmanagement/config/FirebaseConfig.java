package com.example.contentmanagement.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
@Slf4j
@ConditionalOnProperty(name = "firebase.messaging.enabled", havingValue = "true")
public class FirebaseConfig {

    @Value("${firebase.project-id:smgo-notifications}")
    private String projectId;

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.database-url:}")
    private String databaseUrl;

    @Bean
    public FirebaseApp firebaseApp() {
        log.info("Initializing Firebase app with project ID: {}", projectId);

        try {
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setProjectId(projectId);

            if (serviceAccountPath != null && !serviceAccountPath.trim().isEmpty()) {
                try {
                    log.info("Loading Firebase service account from classpath: {}", serviceAccountPath);
                    optionsBuilder.setCredentials(GoogleCredentials.fromStream(
                            new ClassPathResource(serviceAccountPath).getInputStream()
                    ));
                } catch (Exception e) {
                    log.warn("Classpath load failed, trying file system: {}", e.getMessage());
                    optionsBuilder.setCredentials(GoogleCredentials.fromStream(
                            new java.io.FileInputStream(serviceAccountPath)
                    ));
                }
            } else {
                log.info("Using Application Default Credentials for Firebase");
                optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
            }

            if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
                optionsBuilder.setDatabaseUrl(databaseUrl);
            }

            FirebaseOptions options = optionsBuilder.build();

            if (FirebaseApp.getApps().isEmpty()) {
                return FirebaseApp.initializeApp(options);
            }

            return FirebaseApp.getInstance();

        } catch (Exception e) {
            log.warn("Firebase initialization skipped: {}", e.getMessage());
            return null;
        }
    }

    @Bean
    @ConditionalOnBean(FirebaseApp.class)
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        if (firebaseApp == null) {
            log.info("FirebaseApp is null, FirebaseMessaging not created");
            return null;
        }

        return FirebaseMessaging.getInstance(firebaseApp);
    }
}