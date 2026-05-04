package com.example.contentmanagement.dto;

import lombok.*;
import java.util.List;

/**
 * DTO for authentication responses
 * WHY: Standardized response format for login/registration endpoints
 * Contains token and user info for client-side storage and subsequent requests
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private String username;
    private String email;
    private String userId;
    private String message;
    private String role;
    private List<String> roles;

    public AuthResponse(String token, String username, String email, String userId) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.userId = userId;
    }
}
