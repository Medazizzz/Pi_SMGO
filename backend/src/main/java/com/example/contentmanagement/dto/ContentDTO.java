package com.example.contentmanagement.dto;

import com.example.contentmanagement.config.FlexibleLocalDateTimeDeserializer;
import com.example.contentmanagement.entity.ContentStatus;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import com.example.contentmanagement.entity.ContentCategory;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class ContentDTO {
    private String id;

    @NotBlank(message = "Title is mandatory")
    @Size(min = 2, max = 255, message = "Title must be between 2 and 255 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime releaseDate;

    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime publishAt;

    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime expireAt;

    private LocalDateTime publishedAt;

    @NotNull(message = "Category is mandatory")
    private ContentCategory category;

    private String addedById;

    private String addedByUsername;

    @Pattern(regexp = "FILM|SERIES|DOCUMENTARY", message = "Content type must be FILM, SERIES, or DOCUMENTARY")
    private String contentType;

    private ContentStatus status;

    private Boolean visible = Boolean.FALSE;

    private Integer viewCount = 0;

    /**
     * Genre IDs: References to Genre documents (multiple genres per content)
     * WHY: Allows flexible genre management through a separate Genre collection
     */
    private List<String> genreIds = new ArrayList<>();
}
