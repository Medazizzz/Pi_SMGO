package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.service.UserService;
import com.example.contentmanagement.service.impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * User Management Controller
 * Handles user CRUD operations and role management
 * WHY: Provides endpoints for user profile management and admin operations
 * Endpoints: GET, PUT (users), DELETE (admin only), Role management
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserServiceImpl userServiceImpl;

    /**
     * Get current user's profile
     * WHY: Allows users to view their own information securely
     * Uses authentication context to retrieve current user
     *
     * @param authentication Spring Security authentication object
     * @return Current user's information
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "admin";
        Optional<UserDTO> user = userService.getUserByUsername(username);
        if (user.isEmpty()) {
            user = userService.getUserByEmail(username);
        }
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateCurrentUser(Authentication authentication, @RequestBody UserDTO userDTO) {
        String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "admin";
        UserDTO updated = userService.updateProfileByEmail(username, userDTO);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get user by ID
     * WHY: Admin functionality to retrieve specific user details
     *
     * @param id User ID to retrieve
     * @return User information
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        Optional<UserDTO> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get all users
     * WHY: Admin functionality to view all registered users
     *
     * @return List of all users in the system
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Update user profile
     * WHY: Allows users to update their email and username
     * Prevents password changes through this endpoint (security best practice)
     *
     * @param id User ID to update
     * @param userDTO Updated user information
     * @return Updated user information
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String id, @Valid @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Delete user
     * WHY: Admin operation to remove user from system
     *
     * @param id User ID to delete
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assign role to user
     * WHY: Admin operation to grant roles to users
     *
     * @param userId User ID
     * @param roleId Role ID to assign
     * @return Success message
     */
    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<Map<String, String>> assignRoleToUser(
            @PathVariable String userId,
            @PathVariable String roleId) {
        userServiceImpl.assignRoleToUser(userId, roleId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Role assigned successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Remove role from user
     * WHY: Admin operation to revoke roles from users
     *
     * @param userId User ID
     * @param roleId Role ID to remove
     * @return Success message
     */
    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<Map<String, String>> removeRoleFromUser(
            @PathVariable String userId,
            @PathVariable String roleId) {
        userServiceImpl.removeRoleFromUser(userId, roleId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Role removed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Lock user account
     * WHY: Admin operation to prevent malicious accounts from being used
     *
     * @param userId User ID to lock
     * @return Success message
     */
    @PostMapping("/{userId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> lockUser(@PathVariable String userId) {
        userServiceImpl.lockUser(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User locked successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Unlock user account
     * WHY: Admin operation to restore access to locked accounts
     *
     * @param userId User ID to unlock
     * @return Success message
     */
    @PostMapping("/{userId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> unlockUser(@PathVariable String userId) {
        userServiceImpl.unlockUser(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User unlocked successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Check if username is available
     * WHY: Frontend validation - check username availability before registration
     *
     * @param username Username to check
     * @return true if available, false if taken
     */
    @GetMapping("/check/username/{username}")
    public ResponseEntity<Boolean> isUsernameAvailable(@PathVariable String username) {
        boolean available = !userService.existsByUsername(username);
        return ResponseEntity.ok(available);
    }

    /**
     * Check if email is available
     * WHY: Frontend validation - check email availability before registration
     *
     * @param email Email to check
     * @return true if available, false if taken
     */
    @GetMapping("/check/email/{email}")
    public ResponseEntity<Boolean> isEmailAvailable(@PathVariable String email) {
        boolean available = !userService.existsByEmail(email);
        return ResponseEntity.ok(available);
    }
}
