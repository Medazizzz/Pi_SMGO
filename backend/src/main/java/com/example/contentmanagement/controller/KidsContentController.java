package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.KidsContentDTO;
import com.example.contentmanagement.service.KidsContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Kids Content Controller
 * WHY: Provides REST API endpoints for kids content
 * Handles HTTP requests for content management
 */
@RestController
@RequestMapping("/api/kids")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class KidsContentController {

    private final KidsContentService kidsContentService;

    /**
     * Get all kids content
     */
    @GetMapping("/content")
    public ResponseEntity<List<KidsContentDTO>> getAllContent() {
        log.info("GET /api/kids/content - Fetching all kids content");
        return ResponseEntity.ok(kidsContentService.getAllContent());
    }

    /**
     * Get featured content
     */
    @GetMapping("/featured")
    public ResponseEntity<List<KidsContentDTO>> getFeaturedContent() {
        log.info("GET /api/kids/featured - Fetching featured content");
        return ResponseEntity.ok(kidsContentService.getFeaturedContent());
    }

    /**
     * Get content by age group
     */
    @GetMapping("/age-group/{ageGroup}")
    public ResponseEntity<List<KidsContentDTO>> getContentByAgeGroup(
            @PathVariable String ageGroup) {
        log.info("GET /api/kids/age-group/{} - Fetching content for age group", ageGroup);
        return ResponseEntity.ok(kidsContentService.getContentByAgeGroup(ageGroup));
    }

    /**
     * Get content by type
     */
    @GetMapping("/type/{contentType}")
    public ResponseEntity<List<KidsContentDTO>> getContentByType(
            @PathVariable String contentType) {
        log.info("GET /api/kids/type/{} - Fetching content by type", contentType);
        return ResponseEntity.ok(kidsContentService.getContentByType(contentType));
    }

    /**
     * Get educational content
     */
    @GetMapping("/educational")
    public ResponseEntity<List<KidsContentDTO>> getEducationalContent() {
        log.info("GET /api/kids/educational - Fetching educational content");
        return ResponseEntity.ok(kidsContentService.getEducationalContent());
    }

    /**
     * Search content
     */
    @GetMapping("/search")
    public ResponseEntity<List<KidsContentDTO>> searchContent(
            @RequestParam String query) {
        log.info("GET /api/kids/search - Searching content with query: {}", query);
        return ResponseEntity.ok(kidsContentService.searchContent(query));
    }

    /**
     * Get content by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<KidsContentDTO> getContentById(@PathVariable String id) {
        log.info("GET /api/kids/{} - Fetching content by id", id);
        return kidsContentService.getContentById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get recent content
     */
    @GetMapping("/recent")
    public ResponseEntity<List<KidsContentDTO>> getRecentContent(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/kids/recent - Fetching recent content, limit: {}", limit);
        return ResponseEntity.ok(kidsContentService.getRecentContent(limit));
    }

    /**
     * Get content by genre
     */
    @GetMapping("/genre/{genre}")
    public ResponseEntity<List<KidsContentDTO>> getContentByGenre(
            @PathVariable String genre) {
        log.info("GET /api/kids/genre/{} - Fetching content by genre", genre);
        return ResponseEntity.ok(kidsContentService.getContentByGenre(genre));
    }

    /**
     * Create new kids content (Admin only)
     */
    @PostMapping
    public ResponseEntity<KidsContentDTO> createContent(@RequestBody KidsContentDTO dto) {
        log.info("POST /api/kids - Creating new kids content: {}", dto.getTitle());
        KidsContentDTO created = kidsContentService.createContent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update kids content (Admin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<KidsContentDTO> updateContent(
            @PathVariable String id,
            @RequestBody KidsContentDTO dto) {
        log.info("PUT /api/kids/{} - Updating kids content", id);
        KidsContentDTO updated = kidsContentService.updateContent(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete kids content (Admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable String id) {
        log.info("DELETE /api/kids/{} - Deleting kids content", id);
        kidsContentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }
}
