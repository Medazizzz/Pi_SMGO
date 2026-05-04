package com.example.contentmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Role Data Transfer Object
 * WHY: Provides a clean API for role management without exposing internal details
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDTO {
    private String id;
    private String name;
    private String description;
    private Set<String> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
