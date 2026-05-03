package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.KidsContentDTO;
import java.util.List;
import java.util.Optional;

/**
 * Kids Content Service Interface
 * WHY: Defines operations for kids content management
 */
public interface KidsContentService {

    /**
     * Get all kids content
     */
    List<KidsContentDTO> getAllContent();

    /**
     * Get featured content
     */
    List<KidsContentDTO> getFeaturedContent();

    /**
     * Get content by age group
     */
    List<KidsContentDTO> getContentByAgeGroup(String ageGroup);

    /**
     * Get content by type
     */
    List<KidsContentDTO> getContentByType(String contentType);

    /**
     * Get educational content
     */
    List<KidsContentDTO> getEducationalContent();

    /**
     * Search content by query
     */
    List<KidsContentDTO> searchContent(String query);

    /**
     * Get content by ID
     */
    Optional<KidsContentDTO> getContentById(String id);

    /**
     * Create new kids content
     */
    KidsContentDTO createContent(KidsContentDTO dto);

    /**
     * Update kids content
     */
    KidsContentDTO updateContent(String id, KidsContentDTO dto);

    /**
     * Delete kids content
     */
    void deleteContent(String id);

    /**
     * Get recent content
     */
    List<KidsContentDTO> getRecentContent(int limit);

    /**
     * Get content by genre
     */
    List<KidsContentDTO> getContentByGenre(String genre);
}
