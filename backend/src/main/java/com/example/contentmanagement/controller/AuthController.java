package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.AuthRequest;
import com.example.contentmanagement.dto.AuthResponse;
import com.example.contentmanagement.dto.ForgotPasswordRequest;
import com.example.contentmanagement.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles user login and registration endpoints
 * WHY: Separates authentication concerns from other controller logic
 * Endpoints: POST /api/auth/login, POST /api/auth/register
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    /**
     * Register a new user
     * WHY: Creates new user account and returns JWT token
     * Allows immediate usage of the system after registration
     *
     * @param authRequest Registration data (username, password, email)
     * @return AuthResponse with JWT token and user information
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authenticationService.register(authRequest);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Authenticate user and generate JWT token
     * WHY: Validates credentials and returns token for subsequent API calls
     *
     * @param authRequest Login data (username and password)
     * @return AuthResponse with JWT token and user information
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = authenticationService.login(authRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Reset user password by email
     * WHY: Provides a recovery path when users forget credentials
     *
     * @param forgotPasswordRequest Password reset payload (email + new password)
     * @return Success message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        authenticationService.forgotPassword(forgotPasswordRequest);
        return ResponseEntity.ok("Password reset successful");
    }
}
