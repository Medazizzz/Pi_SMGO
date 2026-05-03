package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.UserProfileDTO;
import java.util.List;
import java.util.Optional;

/**
 * User Profile Service Interface
 * WHY: Defines operations for user profile management
 */
public interface UserProfileService {

    /**
     * Get all profiles for a user
     */
    List<UserProfileDTO> getUserProfiles(String userId);

    /**
     * Get profile by ID
     */
    Optional<UserProfileDTO> getProfileById(String profileId);

    /**
     * Get default profile for a user
     */
    Optional<UserProfileDTO> getDefaultProfile(String userId);

    /**
     * Create new profile
     */
    UserProfileDTO createProfile(String userId, UserProfileDTO dto);

    /**
     * Update profile
     */
    UserProfileDTO updateProfile(String profileId, UserProfileDTO dto);

    /**
     * Delete profile
     */
    void deleteProfile(String profileId);

    /**
     * Set default profile
     */
    void setDefaultProfile(String userId, String profileId);
}
