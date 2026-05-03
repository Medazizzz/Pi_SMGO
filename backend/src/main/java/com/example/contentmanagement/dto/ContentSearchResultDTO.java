package com.example.contentmanagement.dto;

import com.example.contentmanagement.entity.ContentCategory;
import com.example.contentmanagement.entity.ContentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentSearchResultDTO {
    private String contentId;
    private String title;
    private String description;
    private ContentCategory category;
    private ContentStatus status;
    private List<String> genres;
    private LocalDateTime publishAt;
    private LocalDateTime releaseDate;
}