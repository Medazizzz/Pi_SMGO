package com.example.contentmanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Kids Content DTO
 * WHY: Transfers kids content data between frontend and backend
 * Supports age groups and content types for children
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KidsContentDTO {
    @JsonProperty("id")
    private String id;

    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("ageGroup")
    private String ageGroup; // "2-5", "6-9", "10-13", "FAMILY"

    @JsonProperty("contentType")
    private String contentType; // "MOVIE", "SERIES", "EDUCATIONAL", "ANIMATION"

    @JsonProperty("rating")
    private Double rating;

    @JsonProperty("duration")
    private String duration;

    @JsonProperty("image")
    private String image;

    @JsonProperty("thumbnail")
    private String thumbnail;

    @JsonProperty("genre")
    private String genre;

    @JsonProperty("characters")
    private List<String> characters;

    @JsonProperty("isEducational")
    private Boolean isEducational;

    @JsonProperty("releasedYear")
    private Integer releasedYear;

    @JsonProperty("featured")
    private Boolean featured;

    @JsonProperty("isFavorite")
    private Boolean isFavorite;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
}
