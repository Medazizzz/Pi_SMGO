package com.example.contentmanagement.controller;

import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.service.UserService;
import com.example.contentmanagement.service.impl.UserServiceImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserService userService;
    private final UserServiceImpl userServiceImpl;

    // =========================
    // CURRENT USER
    // =========================
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {

        String username = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName()
                : "admin";

        Optional<UserDTO> user = userService.getUserByUsername(username);

        if (user.isEmpty()) {
            user = userService.getUserByEmail(username);
        }

        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // =========================
    // UPDATE CURRENT USER
    // =========================
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateCurrentUser(Authentication authentication,
                                                     @RequestBody UserDTO userDTO) {

        String username = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName()
                : "admin";

        UserDTO updated = userService.updateProfileByEmail(username, userDTO);
        return ResponseEntity.ok(updated);
    }

    // =========================
    // 🔥 GET ALL USERS (IMPORTANT)
    // =========================
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userServiceImpl.getAllUsersEntity());
    }

    // =========================
    // 🔥 GET USER BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userServiceImpl.getUserEntityById(id));
    }

    // =========================
    // UPDATE USER
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String id,
                                              @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    // =========================
    // DELETE USER
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // =========================
    // ROLE MANAGEMENT
    // =========================
    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<Map<String, String>> assignRoleToUser(
            @PathVariable String userId,
            @PathVariable String roleId) {

        userServiceImpl.assignRoleToUser(userId, roleId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Role assigned successfully");

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<Map<String, String>> removeRoleFromUser(
            @PathVariable String userId,
            @PathVariable String roleId) {

        userServiceImpl.removeRoleFromUser(userId, roleId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Role removed successfully");

        return ResponseEntity.ok(response);
    }

    // =========================
    // LOCK / UNLOCK
    // =========================
    @PostMapping("/{userId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> lockUser(@PathVariable String userId) {

        userServiceImpl.lockUser(userId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User locked successfully");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> unlockUser(@PathVariable String userId) {

        userServiceImpl.unlockUser(userId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User unlocked successfully");

        return ResponseEntity.ok(response);
    }

    // =========================
    // CHECKS
    // =========================
    @GetMapping("/check/username/{username}")
    public ResponseEntity<Boolean> isUsernameAvailable(@PathVariable String username) {
        return ResponseEntity.ok(!userService.existsByUsername(username));
    }

    @GetMapping("/check/email/{email}")
    public ResponseEntity<Boolean> isEmailAvailable(@PathVariable String email) {
        return ResponseEntity.ok(!userService.existsByEmail(email));
    }
}