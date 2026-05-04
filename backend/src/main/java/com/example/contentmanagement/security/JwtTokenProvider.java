package com.example.contentmanagement.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * JWT Token Provider for managing token generation and validation
 * Handles JwtTokenProvider operations for authentication flow
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.jwtSecret:mySecretKeyForJWTTokenProviderApplicationShouldBeAtLeastThirtyTwoCharactersLongForHS256Algorithm}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:86400000}") // 24 hours default
    private long jwtExpirationMs;

    /**
     * Get signing key for JWT token
     * WHY: Ensures consistent key used across token operations
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Generate JWT token from UserDetails
     * WHY: Centralized token generation with consistent claims
     * Includes user authorities/roles in the token for authorization checks
     *
     * @param userDetails Spring Security UserDetails object
     * @return Generated JWT token
     */
    public String generateToken(UserDetails userDetails) {
        String authorities = userDetails.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.joining(","));
        
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("authorities", authorities)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Get username from JWT token
     * WHY: Extract principal identity for authorization checks
     *
     * @param token JWT token string
     * @return Username/subject from token
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Validate JWT token
     * WHY: Ensure token is properly signed and not expired before processing
     *
     * @param token JWT token string
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException ex) {
            log.error("JWT validation failed: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }
}
