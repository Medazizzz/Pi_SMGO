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
public class ContentAnalyticsDTO {
    private String contentId;
    private String title;
    private ContentCategory category;
    private List<String> genres;
    private Integer viewCount;
    private Integer commentsCount;
    private Double engagementScore;
}