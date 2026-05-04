package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.AuthRequest;
import com.example.contentmanagement.dto.AuthResponse;
import com.example.contentmanagement.dto.ForgotPasswordRequest;
import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.entity.Role;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.exception.UnauthorizedException;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.security.JwtTokenProvider;
import com.example.contentmanagement.service.AuthenticationService;
import com.example.contentmanagement.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Authentication Service Implementation
 * Manages user authentication and registration operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Register a new user
     * WHY: Separates registration logic from authentication logic
     * Ensures duplicate prevention and proper error handling
     */
    @Override
    @Transactional
    public AuthResponse register(AuthRequest authRequest) {
        // Validate email is provided for registration
        if (authRequest.getEmail() == null || authRequest.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required for registration");
        }

        // Create user through UserService (which handles duplicates and encryption)
        UserDTO userDTO = UserDTO.builder()
                .username(authRequest.getUsername())
                .email(authRequest.getEmail())
                .password(authRequest.getPassword())
                .build();

        UserDTO createdUser = userService.createUser(userDTO);
        log.info("User registered successfully: {}", createdUser.getUsername());

        // Authenticate the newly created user
        return login(authRequest);
    }

    /**
     * Reset password using user email
     * WHY: Provides basic password recovery without requiring authenticated session
     */
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest forgotPasswordRequest) {
        User user = userRepository.findByEmail(forgotPasswordRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + forgotPasswordRequest.getEmail()));

        user.setPassword(passwordEncoder.encode(forgotPasswordRequest.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password reset completed for user: {}", user.getUsername());
    }

    /**
     * Authenticate user and generate JWT token
     * WHY: Centralized authentication logic with proper error handling
     * Generates token only after successful authentication
     */
    @Override
    @Transactional
    public AuthResponse login(AuthRequest authRequest) {
        try {
            log.info("Login attempt for user: {}", authRequest.getUsername());
            
            // Get user to check status
            User user = userRepository.findByUsername(authRequest.getUsername())
                    .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
            
            log.info("User found: {}, role: {}", user.getUsername(), user.getRole());

            // Check if account is locked
            if (user.isLocked()) {
                log.warn("Login attempt on locked account: {}", authRequest.getUsername());
                throw new LockedException("Account is locked. Please contact administrator");
            }

            // Check if account is enabled
            if (!user.isEnabled()) {
                log.warn("Login attempt on disabled account: {}", authRequest.getUsername());
                throw new DisabledException("Account is disabled");
            }

            log.info("Account enabled and unlocked, attempting authentication");
            
            // Authenticate using Spring Security's AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getUsername(),
                            authRequest.getPassword()
                    )
            );
            
            log.info("Authentication successful for: {}", authRequest.getUsername());

            // Get UserDetails for token generation
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Generate JWT token
            String token = jwtTokenProvider.generateToken(userDetails);
            log.info("JWT token generated");

            // Update last login time
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // Get user info for response
            UserDTO userDTO = buildUserDTO(user);

            log.info("User logged in successfully: {}", authRequest.getUsername());

            // Return response with token and user info
            return AuthResponse.builder()
                    .token(token)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .userId(user.getId())
                    .role(user.getRole() != null ? user.getRole() : "USER")
                    .roles(user.getRole() != null ? List.of(user.getRole()) : List.of("USER"))
                    .message("Login successful")
                    .build();

        } catch (LockedException ex) {
            throw ex;
        } catch (DisabledException ex) {
            throw ex;
        } catch (AuthenticationException ex) {
            log.error("Authentication failed for user: {}", authRequest.getUsername(), ex);
            throw new UnauthorizedException("Invalid username or password");
        } catch (Exception ex) {
            log.error("Unexpected error during login for user: {}", authRequest.getUsername(), ex);
            throw ex;
        }
    }

    private UserDTO buildUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .status(user.getStatus())
                .build();
    }
}
