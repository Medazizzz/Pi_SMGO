package com.example.contentmanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Profile DTO
 * WHY: Transfer profile data between frontend and backend
 * Supports multiple profile types (adult, kids, teen)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    @JsonProperty("id")
    private String id;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("type")
    private String type; // ADULT, KIDS, TEEN

    @JsonProperty("avatar")
    private String avatar;

    @JsonProperty("color")
    private String color;

    @JsonProperty("isDefault")
    private Boolean isDefault;

    @JsonProperty("ageRestriction")
    private Integer ageRestriction;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
}
