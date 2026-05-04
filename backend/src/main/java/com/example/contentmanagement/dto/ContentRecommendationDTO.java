package com.example.contentmanagement.dto;

import com.example.contentmanagement.entity.ContentCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentRecommendationDTO {
    private String contentId;
    private String title;
    private String description;
    private ContentCategory category;
    private List<String> genres;
    private Integer viewCount;
    private Double engagementScore;
    private Double recommendationScore;
    private String reason;
}