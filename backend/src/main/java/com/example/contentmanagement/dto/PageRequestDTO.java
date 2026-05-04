package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pagination Request DTO
 * WHY: Standardizes pagination parameters across API
 * Allows clients to request specific pages with custom page sizes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequestDTO {
    /**
     * Page number (0-indexed)
     */
    @Builder.Default
    private int page = 0;

    /**
     * Number of items per page
     */
    @Builder.Default
    private int size = 20;

    /**
     * Sort field (e.g., "title", "releaseDate")
     */
    @Builder.Default
    private String sortBy = "id";

    /**
     * Sort direction: "ASC" or "DESC"
     */
    @Builder.Default
    private String sortDirection = "ASC";

    /**
     * Search query for filtering
     */
    private String search;

    /**
     * Category filter
     */
    private String categoryId;

    /**
     * Validate pagination parameters
     */
    public void validate() {
        if (page < 0) page = 0;
        if (size < 1) size = 1;
        if (size > 100) size = 100; // Max 100 items per page
    }
}
