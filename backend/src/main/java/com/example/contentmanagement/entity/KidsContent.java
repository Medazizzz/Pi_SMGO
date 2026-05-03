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
import java.util.List;

/**
 * Kids Content Entity (MongoDB)
 * WHY: Represents kid-friendly content in the database
 * Supports filtering by age groups and content types
 * Uses MongoDB instead of SQL
 */
@Document(collection = "kids_content")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KidsContent {
    @Id
    @JsonProperty("id")
    private String id;

    @Field("title")
    @JsonProperty("title")
    private String title;

    @Field("description")
    @JsonProperty("description")
    private String description;

    @Field("age_group")
    @JsonProperty("ageGroup")
    private String ageGroup; // "2-5", "6-9", "10-13", "FAMILY"

    @Field("content_type")
    @JsonProperty("contentType")
    private String contentType; // "MOVIE", "SERIES", "EDUCATIONAL", "ANIMATION"

    @Field("rating")
    @JsonProperty("rating")
    private Double rating;

    @Field("duration")
    @JsonProperty("duration")
    private String duration;

    @Field("image_url")
    @JsonProperty("image")
    private String image;

    @Field("thumbnail_url")
    @JsonProperty("thumbnail")
    private String thumbnail;

    @Field("genre")
    @JsonProperty("genre")
    private String genre;

    @Field("is_educational")
    @JsonProperty("isEducational")
    private Boolean isEducational;

    @Field("released_year")
    @JsonProperty("releasedYear")
    private Integer releasedYear;

    @Field("featured")
    @JsonProperty("featured")
    private Boolean featured;

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

    // Characters stored as JSON array
    @Field("characters")
    @JsonProperty("characters")
    private List<String> characters;
}
