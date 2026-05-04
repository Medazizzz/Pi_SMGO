package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.UserProfileDTO;
import com.example.contentmanagement.entity.UserProfile;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.UserProfileRepository;
import com.example.contentmanagement.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User Profile Service Implementation (MongoDB)
 * WHY: Implements user profile business logic
 * Handles CRUD operations and profile management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;

    @Override
    public List<UserProfileDTO> getUserProfiles(String userId) {
        log.info("Fetching profiles for user: {}", userId);
        return userProfileRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<UserProfileDTO> getProfileById(String profileId) {
        log.info("Fetching profile with id: {}", profileId);
        return userProfileRepository.findById(profileId)
                .map(this::toDTO);
    }

    @Override
    public Optional<UserProfileDTO> getDefaultProfile(String userId) {
        log.info("Fetching default profile for user: {}", userId);
        return userProfileRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(this::toDTO);
    }

    @Override
    public UserProfileDTO createProfile(String userId, UserProfileDTO dto) {
        log.info("Creating new profile for user: {} - Name: {}", userId, dto.getName());
        
        UserProfile profile = UserProfile.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(dto.getName())
                .type(dto.getType())
                .avatar(dto.getAvatar())
                .color(dto.getColor())
                .isDefault(false)
                .ageRestriction(dto.getAgeRestriction())
                .build();

        // Call preSave to set timestamps
        profile.preSave();

        UserProfile saved = userProfileRepository.save(profile);
        log.info("Profile created with id: {}", saved.getId());
        return toDTO(saved);
    }

    @Override
    public UserProfileDTO updateProfile(String profileId, UserProfileDTO dto) {
        log.info("Updating profile with id: {}", profileId);
        
        UserProfile profile = userProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + profileId));

        profile.setName(dto.getName());
        profile.setType(dto.getType());
        profile.setAvatar(dto.getAvatar());
        profile.setColor(dto.getColor());
        profile.setAgeRestriction(dto.getAgeRestriction());
        profile.preSave(); // Update timestamp

        UserProfile updated = userProfileRepository.save(profile);
        log.info("Profile updated with id: {}", profileId);
        return toDTO(updated);
    }

    @Override
    public void deleteProfile(String profileId) {
        log.info("Deleting profile with id: {}", profileId);
        
        if (!userProfileRepository.existsById(profileId)) {
            throw new ResourceNotFoundException("Profile not found with id: " + profileId);
        }
        
        userProfileRepository.deleteById(profileId);
        log.info("Profile deleted with id: {}", profileId);
    }

    @Override
    public void setDefaultProfile(String userId, String profileId) {
        log.info("Setting default profile for user: {} - profileId: {}", userId, profileId);
        
        // Reset all profiles to non-default
        userProfileRepository.findByUserId(userId).forEach(profile -> {
            profile.setIsDefault(false);
            profile.preSave();
            userProfileRepository.save(profile);
        });

        // Set the selected profile as default
        UserProfile profile = userProfileRepository.findByIdAndUserId(profileId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + profileId));
        
        profile.setIsDefault(true);
        profile.preSave();
        userProfileRepository.save(profile);
        log.info("Default profile set for user: {}", userId);
    }

    /**
     * Convert UserProfile entity to DTO
     */
    private UserProfileDTO toDTO(UserProfile entity) {
        return UserProfileDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .name(entity.getName())
                .type(entity.getType())
                .avatar(entity.getAvatar())
                .color(entity.getColor())
                .isDefault(entity.getIsDefault())
                .ageRestriction(entity.getAgeRestriction())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
