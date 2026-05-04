package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.UserDTO;
import java.util.List;
import java.util.Optional;

/**
 * User Service Interface
 * Defines contract for user management operations
 */
public interface UserService {
    /**
     * Create a new user
     * WHY: Encapsulates user creation logic with validation
     * 
     * @param userDTO User data transfer object with registration info
     * @return Created user DTO
     */
    UserDTO createUser(UserDTO userDTO);

    /**
     * Get user by ID
     * @param id User ID
     * @return User DTO if found
     */
    Optional<UserDTO> getUserById(String id);

    /**
     * Get user by username
     * @param username Username
     * @return User DTO if found
     */
    Optional<UserDTO> getUserByUsername(String username);

    /**
     * Get user by email
     * @param email User email
     * @return User DTO if found
     */
    Optional<UserDTO> getUserByEmail(String email);

    /**
     * Get all users
     * WHY: Admin operations to view all registered users
     * @return List of all users
     */
    List<UserDTO> getAllUsers();

    /**
     * Update user information
     * WHY: Allows users to update their profile
     *
     * @param id User ID
     * @param userDTO Updated user data
     * @return Updated user DTO
     */
    UserDTO updateUser(String id, UserDTO userDTO);

    /**
     * Update current user profile identified by email from authentication context.
     *
     * @param email Authenticated user email/username
     * @param userDTO Partial profile data
     * @return Updated user DTO
     */
    UserDTO updateProfileByEmail(String email, UserDTO userDTO);

    /**
     * Delete user by ID
     * WHY: Admin functionality for user removal
     *
     * @param id User ID to delete
     */
    void deleteUser(String id);

    /**
     * Check if user exists by username
     * @param username Username to check
     * @return true if exists, false otherwise
     */
    boolean existsByUsername(String username);

    /**
     * Check if user exists by email
     * @param email Email to check
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);
}
