package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.*;
import com.example.contentmanagement.service.ContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Content Management Controller
 * WHY: Handles all content-related API endpoints (Films, Series, Documentaries)
 * Provides CRUD operations with pagination and filtering support
 */
@Slf4j
@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    // ==================== FILM ENDPOINTS ====================

    @PostMapping("/films")
    public ResponseEntity<?> createFilm(@Valid @RequestBody FilmDTO filmDTO, Authentication authentication) {
        String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "anonymous";
        log.info("Creating film: {} by user: {}", filmDTO.getTitle(), username);
        FilmDTO result = contentService.createFilm(filmDTO, username);
        log.info("Film created successfully with ID: {}", result.getId());
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/films/{id}")
    public ResponseEntity<?> updateFilm(@PathVariable String id, @Valid @RequestBody FilmDTO filmDTO) {
        try {
            log.info("Updating film: {}", id);
            FilmDTO result = contentService.updateFilm(id, filmDTO);
            log.info("Film updated successfully: {}", id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating film: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error updating film: " + e.getMessage());
        }
    }

    // ==================== SERIES ENDPOINTS ====================

    @PostMapping("/series")
    public ResponseEntity<?> createSeries(@Valid @RequestBody SeriesDTO seriesDTO, Authentication authentication) {
        String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "anonymous";
        log.info("Creating series: {} by user: {}", seriesDTO.getTitle(), username);
        SeriesDTO result = contentService.createSeries(seriesDTO, username);
        log.info("Series created successfully with ID: {}", result.getId());
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/series/{id}")
    public ResponseEntity<?> updateSeries(@PathVariable String id, @Valid @RequestBody SeriesDTO seriesDTO) {
        try {
            log.info("Updating series: {}", id);
            SeriesDTO result = contentService.updateSeries(id, seriesDTO);
            log.info("Series updated successfully: {}", id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating series: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error updating series: " + e.getMessage());
        }
    }

    // ==================== DOCUMENTARY ENDPOINTS ====================

    @PostMapping("/documentaries")
    public ResponseEntity<?> createDocumentary(@Valid @RequestBody DocumentaryDTO documentaryDTO, Authentication authentication) {
        String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "anonymous";
        log.info("Creating documentary: {} by user: {}", documentaryDTO.getTitle(), username);
        DocumentaryDTO result = contentService.createDocumentary(documentaryDTO, username);
        log.info("Documentary created successfully with ID: {}", result.getId());
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @PutMapping("/documentaries/{id}")
    public ResponseEntity<?> updateDocumentary(@PathVariable String id, @Valid @RequestBody DocumentaryDTO documentaryDTO) {
        try {
            log.info("Updating documentary: {}", id);
            DocumentaryDTO result = contentService.updateDocumentary(id, documentaryDTO);
            log.info("Documentary updated successfully: {}", id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating documentary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error updating documentary: " + e.getMessage());
        }
    }

    // ==================== GENERIC CONTENT ENDPOINTS ====================

    /**
     * Get content by ID
     * WHY: Retrieves specific content details
     * @param id Content ID
     * @return Content details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContentDTO> getContentById(@PathVariable String id) {
        return ResponseEntity.ok(contentService.getContentById(id));
    }

    /**
     * Get all content (legacy endpoint - returns all without pagination)
     * WHY: Backward compatibility
     * @return List of all content
     */
    @GetMapping
    public ResponseEntity<List<ContentDTO>> getAllContent() {
        return ResponseEntity.ok(contentService.getAllContent());
    }

    /**
     * Get paginated and filtered content
     * WHY: Supports large datasets with pagination and filtering
     * Allows clients to search, filter by category, and sort results
     * 
     * @param page Page number (0-indexed, default 0)
     * @param size Items per page (default 20, max 100)
     * @param search Search query for title/description
     * @param categoryId Filter by category ID
     * @param sortBy Field to sort by (default "id")
     * @param sortDirection Sort direction: ASC or DESC (default ASC)
     * @return Paginated content response
     */
    @GetMapping("/paginated")
    public ResponseEntity<PageResponseDTO<ContentDTO>> getContentPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(contentService.getAllContentPaginated(page, size, search, categoryId, sortBy, sortDirection));
    }

    /**
     * Delete content
     * WHY: Removes content from system (authenticated users can delete their own or admins can delete any)
     * @param id Content ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable String id) {
        contentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }
}
