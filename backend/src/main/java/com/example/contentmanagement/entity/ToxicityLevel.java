package com.example.contentmanagement.entity;

/**
 * Niveaux de toxicité avec actions automatiques associées.
 */
public enum ToxicityLevel {
    SAFE(0, 20, "✅ Safe"),
    WARNING(21, 40, "⚠️ Warning"),
    HIDDEN(41, 70, "🔒 Hidden"),
    DELETED(71, Integer.MAX_VALUE, "❌ Deleted");

    public final int minScore;
    public final int maxScore;
    public final String label;

    ToxicityLevel(int minScore, int maxScore, String label) {
        this.minScore = minScore;
        this.maxScore = maxScore;
        this.label = label;
    }

    public static ToxicityLevel fromScore(int score) {
        for (ToxicityLevel level : values()) {
            if (score >= level.minScore && score <= level.maxScore) {
                return level;
            }
        }
        return SAFE;
    }
}