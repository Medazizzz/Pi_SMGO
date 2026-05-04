package com.example.contentmanagement.entity;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.DBRef;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.example.contentmanagement.validation.NoSpecialCharacters;
import com.example.contentmanagement.validation.ValidUsername;
import com.example.contentmanagement.validation.ValidPhoneNumber;

/**
 * User Entity
 * Represents a user in the system with roles and audit information
 */
@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;

    @NotBlank(message = "Username is mandatory")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @ValidUsername
    private String username;

    @NotBlank(message = "Password is mandatory")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

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

    // Status: ACTIVE, INACTIVE, SUSPENDED, DELETED
    @Builder.Default
    private String status = "ACTIVE";

    // Support for direct role string (from MongoDB)
    private String role;

    @Transient
    @DBRef
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // Audit fields
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private boolean locked = false;
    private boolean enabled = true;
}
