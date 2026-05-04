package com.example.contentmanagement.entity;

/**
 * Content Category Enum
 * WHY: Defines the 3 main content types that the platform supports
 * Each content item must belong to exactly one category
 */
public enum ContentCategory {
    MOVIE("Movie"),
    SERIES("Series"),
    DOCUMENTARY("Documentary");

    private final String displayName;

    ContentCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ContentCategory fromString(String value) {
        try {
            return ContentCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
