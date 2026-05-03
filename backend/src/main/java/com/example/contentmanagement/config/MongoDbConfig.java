package com.example.contentmanagement.config;

import com.example.contentmanagement.entity.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.stereotype.Component;

/**
 * MongoDB Configuration & Initialization
 * WHY: Initialize MongoDB collections, indexes, and sample data
 * Runs on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MongoDbConfig implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    private final MongoMappingContext mongoMappingContext;

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing MongoDB collections and indexes...");
        initializeIndexes();
        initializeSampleData();
        log.info("MongoDB initialization completed!");
    }

    /**
     * Initialize MongoDB indexes
     */
    private void initializeIndexes() {
        try {
            // Create indexes for user_profiles collection
            mongoTemplate.indexOps(UserProfile.class)
                    .ensureIndex(new org.springframework.data.mongodb.core.index.Index()
                            .on("user_id", org.springframework.data.domain.Sort.Direction.ASC));
            log.info("Created index on user_profiles: user_id");

            mongoTemplate.indexOps(UserProfile.class)
                    .ensureIndex(new org.springframework.data.mongodb.core.index.Index()
                            .on("user_id", org.springframework.data.domain.Sort.Direction.ASC)
                            .on("is_default", org.springframework.data.domain.Sort.Direction.ASC));
            log.info("Created composite index on user_profiles: user_id, is_default");

            mongoTemplate.indexOps(UserProfile.class)
                    .ensureIndex(new org.springframework.data.mongodb.core.index.Index()
                            .on("user_id", org.springframework.data.domain.Sort.Direction.ASC)
                            .on("type", org.springframework.data.domain.Sort.Direction.ASC));
            log.info("Created composite index on user_profiles: user_id, type");

        } catch (Exception e) {
            log.error("Error creating indexes: {}", e.getMessage());
        }
    }

    /**
     * Initialize sample data
     */
    private void initializeSampleData() {
        try {
            // Check if collection exists and has data
            long count = mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), 
                    UserProfile.class);
            
            if (count == 0) {
                log.info("Inserting sample user profiles...");
                
                // Create sample profiles
                UserProfile adultProfile = UserProfile.builder()
                        .id("profile_1")
                        .userId("user_123")
                        .name("mayssen")
                        .type("ADULT")
                        .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=adult-avatar")
                        .color("#4D96FF")
                        .isDefault(true)
                        .ageRestriction(null)
                        .build();
                adultProfile.preSave();

                UserProfile kidsProfile = UserProfile.builder()
                        .id("profile_2")
                        .userId("user_123")
                        .name("Enfants")
                        .type("KIDS")
                        .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=kids-avatar")
                        .color("#FF6B9D")
                        .isDefault(false)
                        .ageRestriction(13)
                        .build();
                kidsProfile.preSave();

                mongoTemplate.save(adultProfile);
                mongoTemplate.save(kidsProfile);
                
                log.info("Sample profiles inserted successfully");
            } else {
                log.info("Sample profiles already exist in MongoDB (count: {})", count);
            }
        } catch (Exception e) {
            log.error("Error initializing sample data: {}", e.getMessage());
        }
    }
}
