package com.example.contentmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;
import com.example.contentmanagement.validation.NoSpecialCharacters;
import com.example.contentmanagement.validation.ValidUsername;
import com.example.contentmanagement.validation.ValidPhoneNumber;

/**
 * User Data Transfer Object
 * WHY: Separates user entity from API response, hides sensitive data like passwords
 * Password field only used for registration, never included in GET responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private String id;

    @NotBlank(message = "Username is mandatory")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @ValidUsername
    private String username;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    private String email;

    @NoSpecialCharacters(message = "First name cannot contain special characters")
    private String firstName;

    @NoSpecialCharacters(message = "Last name cannot contain special characters")
    private String lastName;

    @ValidPhoneNumber
    private String phoneNumber;

    private String photoUrl;

    // Password field - only used during registration/creation
    // Never included in response DTOs (setter handles mapping)
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String status; // ACTIVE, INACTIVE, SUSPENDED, DELETED
    private Set<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private boolean locked;
    private boolean enabled;

    private String contentType; // For response

    public static UserDTO fromUsername(String username) {
        return UserDTO.builder().username(username).build();
    }
}
