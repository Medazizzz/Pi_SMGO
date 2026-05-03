package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Content;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.ArrayList;

/**
 * Recommendation Service
 * WHY: Provides AI-powered content recommendations
 * Wraps AI service calls for personalized content suggestions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final ContentRepository contentRepository;
    private final ReservationRepository reservationRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.recommendation-base-url:http://localhost:5055}")
    private String recommendationServiceBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Get content recommendations for a user
     */
    public List<String> getRecommendationsForUser(String userId) {
        try {
            List<Content> allContents = contentRepository.findAll();
            if (allContents.isEmpty()) {
                return List.of();
            }

            List<Content> recommendations = callAiRecommendations(userId, allContents, 5);
            return recommendations.stream()
                    .map(Content::getId)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to get AI recommendations for user {}: {}", userId, e.getMessage());
            // Fallback to basic recommendations
            return getFallbackRecommendations(userId);
        }
    }

    /**
     * Get fallback recommendations when AI service is unavailable
     */
    private List<String> getFallbackRecommendations(String userId) {
        try {
            // Get user's reservation history
            List<String> userReservations = reservationRepository.findByUserId(userId)
                    .stream()
                    .map(reservation -> reservation.getContenuId())
                    .collect(Collectors.toList());

            if (userReservations.isEmpty()) {
                // Return top-rated content
                return contentRepository.findAll().stream()
                        .sorted((a, b) -> Double.compare(
                                b.getRating() != null ? b.getRating() : 0.0,
                                a.getRating() != null ? a.getRating() : 0.0))
                        .limit(5)
                        .map(Content::getId)
                        .collect(Collectors.toList());
            }

            // Get content similar to user's history
            Set<String> userGenres = new HashSet<>();
            Set<String> userTypes = new HashSet<>();

            for (String contentId : userReservations) {
                contentRepository.findById(contentId).ifPresent(content -> {
                    if (content.getGenreIds() != null) {
                        userGenres.addAll(content.getGenreIds());
                    }
                    if (content.getContentType() != null) {
                        userTypes.add(content.getContentType());
                    }
                });
            }

            // Find similar content
            return contentRepository.findAll().stream()
                    .filter(content -> !userReservations.contains(content.getId()))
                    .filter(content -> {
                        if (content.getGenreIds() != null && !userGenres.isEmpty()) {
                            return content.getGenreIds().stream().anyMatch(userGenres::contains);
                        }
                        return false;
                    })
                    .sorted((a, b) -> Double.compare(
                            b.getRating() != null ? b.getRating() : 0.0,
                            a.getRating() != null ? a.getRating() : 0.0))
                    .limit(5)
                    .map(Content::getId)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error in fallback recommendations: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Call AI recommendation service
     */
    private List<Content> callAiRecommendations(String userId, List<Content> contents, int limit) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("limit", Math.max(1, limit));
        payload.put("user", buildAiUserProfile(userId, contents));
        payload.put("contents", contents.stream().map(this::toAiContentPayload).collect(Collectors.toList()));

        String requestBody = objectMapper.writeValueAsString(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(recommendationServiceBaseUrl + "/recommend"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(12))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("AI service returned HTTP " + response.statusCode());
        }

        List<Map<String, Object>> responseItems = objectMapper.readValue(response.body(), new TypeReference<List<Map<String, Object>>>() {});
        return responseItems.stream()
                .map(this::mapAiRecommendation)
                .collect(Collectors.toList());
    }

    /**
     * Build AI user profile from user data
     */
    private Map<String, Object> buildAiUserProfile(String userId, List<Content> contents) {
        Set<String> preferredCategories = new HashSet<>();
        Set<String> preferredTypes = new HashSet<>();
        Set<String> preferredGenres = new HashSet<>();

        if (userId != null && !userId.isBlank()) {
            reservationRepository.findByUserId(userId).forEach(reservation -> contents.stream()
                    .filter(content -> content.getId().equals(reservation.getContenuId()))
                    .findFirst()
                    .ifPresent(content -> {
                        if (content.getCategory() != null) {
                            preferredCategories.add(content.getCategory().name());
                        }
                        if (content.getContentType() != null) {
                            preferredTypes.add(content.getContentType());
                        }
                        if (content.getGenreIds() != null) {
                            preferredGenres.addAll(content.getGenreIds());
                        }
                    }));
        }

        // If no preferences from reservations, use all genres/types
        if (preferredGenres.isEmpty()) {
            contents.forEach(content -> {
                if (content.getGenreIds() != null) {
                    preferredGenres.addAll(content.getGenreIds());
                }
            });
        }

        Map<String, Object> userProfile = new HashMap<>();
        userProfile.put("id", userId);
        userProfile.put("preferredCategories", new ArrayList<>(preferredCategories));
        userProfile.put("preferredTypes", new ArrayList<>(preferredTypes));
        userProfile.put("preferredGenres", new ArrayList<>(preferredGenres));

        return userProfile;
    }

    /**
     * Convert content to AI service payload format
     */
    private Map<String, Object> toAiContentPayload(Content content) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", content.getId());
        payload.put("title", content.getTitle());
        payload.put("description", content.getDescription());
        payload.put("type", content.getContentType());
        payload.put("rating", content.getRating());
        payload.put("genres", content.getGenreIds() != null ? content.getGenreIds() : List.of());
        payload.put("categories", content.getCategory() != null ? List.of(content.getCategory().name()) : List.of());
        return payload;
    }

    /**
     * Map AI recommendation response to Content
     */
    private Content mapAiRecommendation(Map<String, Object> aiResponse) {
        String contentId = (String) aiResponse.get("id");
        return contentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Recommended content not found: " + contentId));
    }
}