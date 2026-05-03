package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * User Profile Entity (MongoDB)
 * WHY: Represents user profiles (for multiple profiles per account)
 * Supports family accounts like Netflix/Shahid
 * Uses MongoDB instead of SQL
 */
@Document(collection = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    @JsonProperty("id")
    private String id;

    @Field("user_id")
    @JsonProperty("userId")
    private String userId;

    @Field("name")
    @JsonProperty("name")
    private String name;

    @Field("type")
    @JsonProperty("type")
    private String type; // ADULT, KIDS, TEEN

    @Field("avatar_url")
    @JsonProperty("avatar")
    private String avatar;

    @Field("color")
    @JsonProperty("color")
    private String color;

    @Field("is_default")
    @JsonProperty("isDefault")
    private Boolean isDefault;

    @Field("age_restriction")
    @JsonProperty("ageRestriction")
    private Integer ageRestriction;

    @Field("created_at")
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @Field("updated_at")
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Called before saving to MongoDB
     */
    public void preSave() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }
}
