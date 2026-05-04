package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.AuthRequest;
import com.example.contentmanagement.dto.AuthResponse;
import com.example.contentmanagement.dto.ForgotPasswordRequest;

/**
 * Authentication Service Interface
 * Handles user authentication and registration
 */
public interface AuthenticationService {

    /**
     * Register a new user
     * WHY: Encapsulates registration logic including validation and user creation
     *
     * @param authRequest Registration request with username, password, email
     * @return AuthResponse with JWT token and user info
     */
    AuthResponse register(AuthRequest authRequest);

    /**
     * Authenticate user with username and password
     * WHY: Validates credentials and generates JWT token for subsequent API calls
     *
     * @param authRequest Login request with username and password
     * @return AuthResponse with JWT token and user info
     */
    AuthResponse login(AuthRequest authRequest);

    /**
     * Reset user password by email
     * WHY: Supports password recovery for users who forgot credentials
     *
     * @param forgotPasswordRequest Recovery payload with email and new password
     */
    void forgotPassword(ForgotPasswordRequest forgotPasswordRequest);
}
