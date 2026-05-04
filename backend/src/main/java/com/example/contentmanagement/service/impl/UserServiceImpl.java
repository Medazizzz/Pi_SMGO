package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.entity.Role;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.repository.RoleRepository;
import com.example.contentmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * User Service Implementation
 * Handles all user management business logic
 * WHY: Separates business logic from controller layer for better testability and maintainability
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Create a new user with password encryption
     * WHY: Ensures passwords are encrypted before storage for security
     * Prevents duplicate usernames and emails
     */
    @Override
    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        // Check for duplicates
        if (existsByUsername(userDTO.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + userDTO.getUsername());
        }
        if (userDTO.getEmail() != null && existsByEmail(userDTO.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + userDTO.getEmail());
        }

        User user = User.builder()
                .username(userDTO.getUsername())
                .email(userDTO.getEmail())
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .phoneNumber(userDTO.getPhoneNumber())
            .photoUrl(userDTO.getPhotoUrl())
                .password(passwordEncoder.encode(userDTO.getPassword())) // Encrypt password
                .status("ACTIVE")
                .enabled(true)
                .locked(false)
                .createdAt(LocalDateTime.now())
                .role("USER") // Set default role as string
                .roles(new HashSet<>())
                .build();

        // Optionally assign roles from userDTO if specified
        if (userDTO.getRoles() != null && !userDTO.getRoles().isEmpty()) {
            // Set the role from userDTO
            user.setRole(userDTO.getRoles().stream().findFirst().orElse("USER"));
        }

        User savedUser = userRepository.save(user);
        log.info("User created successfully: {}", savedUser.getUsername());
        return mapToUserDTO(savedUser);
    }

    @Override
    public Optional<UserDTO> getUserById(String id) {
        return userRepository.findById(id).map(this::mapToUserDTO);
    }

    @Override
    public Optional<UserDTO> getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(this::mapToUserDTO);
    }

    @Override
    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToUserDTO);
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update user information
     * WHY: Allows partial updates without exposing password field
     * Does not allow password updates through this method (security best practice)
     */
    @Override
    @Transactional
    public UserDTO updateUser(String id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Update only non-sensitive fields
        if (userDTO.getUsername() != null && !userDTO.getUsername().equals(user.getUsername())) {
            if (existsByUsername(userDTO.getUsername())) {
                throw new DuplicateResourceException("Username already exists: " + userDTO.getUsername());
            }
            user.setUsername(userDTO.getUsername());
        }

        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
            if (existsByEmail(userDTO.getEmail())) {
                throw new DuplicateResourceException("Email already exists: " + userDTO.getEmail());
            }
            user.setEmail(userDTO.getEmail());
        }

        if (userDTO.getFirstName() != null) {
            user.setFirstName(userDTO.getFirstName());
        }
        if (userDTO.getLastName() != null) {
            user.setLastName(userDTO.getLastName());
        }
        if (userDTO.getPhoneNumber() != null) {
            user.setPhoneNumber(userDTO.getPhoneNumber());
        }

        if (userDTO.getPhotoUrl() != null) {
            user.setPhotoUrl(userDTO.getPhotoUrl());
        }

        if (userDTO.getStatus() != null) {
            user.setStatus(userDTO.getStatus());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", updatedUser.getUsername());
        return mapToUserDTO(updatedUser);
    }

    @Override
    @Transactional
    public UserDTO updateProfileByEmail(String email, UserDTO userDTO) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (userDTO.getUsername() != null && !userDTO.getUsername().isBlank()
                && !userDTO.getUsername().equals(user.getUsername())) {
            if (existsByUsername(userDTO.getUsername())) {
                throw new DuplicateResourceException("Username already exists: " + userDTO.getUsername());
            }
            user.setUsername(userDTO.getUsername());
        }

        if (userDTO.getEmail() != null && !userDTO.getEmail().isBlank()
                && !userDTO.getEmail().equals(user.getEmail())) {
            if (existsByEmail(userDTO.getEmail())) {
                throw new DuplicateResourceException("Email already exists: " + userDTO.getEmail());
            }
            user.setEmail(userDTO.getEmail());
        }

        if (userDTO.getPhotoUrl() != null) {
            user.setPhotoUrl(userDTO.getPhotoUrl());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return mapToUserDTO(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
        log.info("User deleted successfully: {}", user.getUsername());
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    /**
     * Assign role to user
     * @param userId User ID
     * @param roleId Role ID
     */
    @Transactional
    public void assignRoleToUser(String userId, String roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));
        
        user.getRoles().add(role);
        userRepository.save(user);
        log.info("Role {} assigned to user {}", role.getName(), user.getUsername());
    }

    /**
     * Remove role from user
     * @param userId User ID
     * @param roleId Role ID
     */
    @Transactional
    public void removeRoleFromUser(String userId, String roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));
        
        user.getRoles().remove(role);
        userRepository.save(user);
        log.info("Role {} removed from user {}", role.getName(), user.getUsername());
    }

    /**
     * Lock/Unlock user account
     */
    @Transactional
    public void lockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setLocked(true);
        userRepository.save(user);
        log.info("User {} locked", user.getUsername());
    }

    /**
     * Unlock user account
     */
    @Transactional
    public void unlockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setLocked(false);
        userRepository.save(user);
        log.info("User {} unlocked", user.getUsername());
    }

    /**
     * Update last login time
     */
    @Transactional
    public void updateLastLogin(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Map User entity to UserDTO
     * WHY: Prevents sensitive data (password) from being exposed in responses
     */
    private UserDTO mapToUserDTO(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .photoUrl(user.getPhotoUrl())
                .status(user.getStatus())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .locked(user.isLocked())
                .enabled(user.isEnabled())
                .build();
    }
}
