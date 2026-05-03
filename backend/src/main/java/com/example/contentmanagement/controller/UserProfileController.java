package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.UserProfileDTO;
import com.example.contentmanagement.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User Profile Controller
 * WHY: Provides REST API endpoints for profile management
 * Handles HTTP requests for profile operations
 */
@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserProfileController {

    private final UserProfileService userProfileService;

    /**
     * Get all profiles for current user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserProfileDTO>> getUserProfiles(@PathVariable String userId) {
        log.info("GET /api/profiles/user/{} - Fetching profiles", userId);
        return ResponseEntity.ok(userProfileService.getUserProfiles(userId));
    }

    /**
     * Get profile by ID
     */
    @GetMapping("/{profileId}")
    public ResponseEntity<UserProfileDTO> getProfileById(@PathVariable String profileId) {
        log.info("GET /api/profiles/{} - Fetching profile", profileId);
        return userProfileService.getProfileById(profileId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get default profile for user
     */
    @GetMapping("/user/{userId}/default")
    public ResponseEntity<UserProfileDTO> getDefaultProfile(@PathVariable String userId) {
        log.info("GET /api/profiles/user/{}/default - Fetching default profile", userId);
        return userProfileService.getDefaultProfile(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Create new profile
     */
    @PostMapping("/user/{userId}")
    public ResponseEntity<UserProfileDTO> createProfile(
            @PathVariable String userId,
            @RequestBody UserProfileDTO dto) {
        log.info("POST /api/profiles/user/{} - Creating profile: {}", userId, dto.getName());
        UserProfileDTO created = userProfileService.createProfile(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update profile
     */
    @PutMapping("/{profileId}")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @PathVariable String profileId,
            @RequestBody UserProfileDTO dto) {
        log.info("PUT /api/profiles/{} - Updating profile", profileId);
        UserProfileDTO updated = userProfileService.updateProfile(profileId, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete profile
     */
    @DeleteMapping("/{profileId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String profileId) {
        log.info("DELETE /api/profiles/{} - Deleting profile", profileId);
        userProfileService.deleteProfile(profileId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Set default profile
     */
    @PutMapping("/user/{userId}/default/{profileId}")
    public ResponseEntity<Void> setDefaultProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {
        log.info("PUT /api/profiles/user/{}/default/{} - Setting default profile", userId, profileId);
        userProfileService.setDefaultProfile(userId, profileId);
        return ResponseEntity.noContent().build();
    }
}
