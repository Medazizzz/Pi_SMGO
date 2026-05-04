package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * User Profile Repository (MongoDB)
 * WHY: Provides database access for user profiles
 * Uses Spring Data MongoDB
 */
@Repository
public interface UserProfileRepository extends MongoRepository<UserProfile, String> {

    /**
     * Find all profiles for a user
     */
    List<UserProfile> findByUserId(String userId);

    /**
     * Find default profile for a user
     */
    Optional<UserProfile> findByUserIdAndIsDefaultTrue(String userId);

    /**
     * Find profile by ID and user ID
     */
    Optional<UserProfile> findByIdAndUserId(String id, String userId);

    /**
     * Count profiles for a user
     */
    long countByUserId(String userId);

    /**
     * Find profiles by type
     */
    List<UserProfile> findByUserIdAndType(String userId, String type);

    /**
     * Delete all profiles for a user
     */
    void deleteByUserId(String userId);
}
