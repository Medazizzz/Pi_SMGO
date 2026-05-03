package com.example.contentmanagement.repository;

import com.example.contentmanagement.dto.ContentAnalyticsDTO;
import com.example.contentmanagement.dto.ContentSearchResultDTO;

import java.util.List;

public interface ContentRepositoryCustom {
    List<ContentAnalyticsDTO> findContentAnalytics(String category, String genreKeyword, int limit);

    List<ContentSearchResultDTO> advancedKeywordSearch(String keyword, String genreKeyword, String category, int limit);
}