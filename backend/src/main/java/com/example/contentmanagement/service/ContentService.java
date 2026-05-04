package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.ContentDTO;
import com.example.contentmanagement.dto.PageResponseDTO;
import com.example.contentmanagement.dto.FilmDTO;
import com.example.contentmanagement.dto.SeriesDTO;
import com.example.contentmanagement.dto.DocumentaryDTO;
import java.util.List;

/**
 * Content Service Interface
 * WHY: Defines contract for content management operations
 * Supports CRUD operations for Films, Series, and Documentaries
 */
public interface ContentService {
    // ==================== CREATE ====================
    FilmDTO createFilm(FilmDTO filmDTO, String username);
    SeriesDTO createSeries(SeriesDTO seriesDTO, String username);
    DocumentaryDTO createDocumentary(DocumentaryDTO documentaryDTO, String username);
    
    // ==================== READ ====================
    ContentDTO getContentById(String id);
    List<ContentDTO> getAllContent();
    
    /**
     * Get paginated and filtered content
     * WHY: Supports large datasets with pagination and filtering
     * @param page Page number (0-indexed)
     * @param size Items per page
     * @param search Search query
     * @param categoryId Category filter
     * @param sortBy Sort field
     * @param sortDirection Sort direction (ASC/DESC)
     * @return Paginated content response
     */
    PageResponseDTO<ContentDTO> getAllContentPaginated(int page, int size, String search, String categoryId, String sortBy, String sortDirection);
    
    // ==================== UPDATE ====================
    FilmDTO updateFilm(String id, FilmDTO filmDTO);
    SeriesDTO updateSeries(String id, SeriesDTO seriesDTO);
    DocumentaryDTO updateDocumentary(String id, DocumentaryDTO documentaryDTO);
    
    // ==================== DELETE ====================
    void deleteContent(String id);
}
