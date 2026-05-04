package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.GenreDTO;
import java.util.List;

/**
 * Genre Service Interface
 * WHY: Defines contract for genre management operations
 * Supports full CRUD operations for genres
 */
public interface GenreService {
    // ==================== CREATE ====================
    GenreDTO createGenre(GenreDTO genreDTO);
    
    // ==================== READ ====================
    GenreDTO getGenreById(String id);
    List<GenreDTO> getAllGenres();
    
    // ==================== UPDATE ====================
    GenreDTO updateGenre(String id, GenreDTO genreDTO);
    
    // ==================== DELETE ====================
    void deleteGenre(String id);
}
