package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.*;
import com.example.contentmanagement.entity.*;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.FilmRepository;
import com.example.contentmanagement.repository.SeriesRepository;
import com.example.contentmanagement.repository.DocumentaryRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.repository.GenreRepository;
import com.example.contentmanagement.service.ContentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentServiceImpl implements ContentService {

    private final ContentRepository contentRepository;
    private final FilmRepository filmRepository;
    private final SeriesRepository seriesRepository;
    private final DocumentaryRepository documentaryRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final GenreRepository genreRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.recommendation-base-url:http://localhost:5055}")
    private String recommendationServiceBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    @Transactional
    public FilmDTO createFilm(FilmDTO filmDTO, String username) {
        log.info("Creating film: {}", filmDTO.getTitle());
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> createAnonymousUserIfNeeded(username));
        log.info("Film user: {}", user.getUsername());

        Film film = new Film();
        mapCommonFieldsToEntity(filmDTO, film, user);
        film.setContentType("FILM");
        film.setDurationInMinutes(filmDTO.getDurationInMinutes());
        film.setDirector(filmDTO.getDirector());
        log.info("Film mapped with title: {}, director: {}", film.getTitle(), film.getDirector());

        Film savedFilm = filmRepository.save(film);
        log.info("Film saved successfully with ID: {}", savedFilm.getId());
        return mapToFilmDTO(savedFilm);
    }

    @Override
    @Transactional
    public SeriesDTO createSeries(SeriesDTO seriesDTO, String username) {
        log.info("Creating series: {}", seriesDTO.getTitle());
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> createAnonymousUserIfNeeded(username));
        log.info("Series user: {}", user.getUsername());

        Series series = new Series();
        mapCommonFieldsToEntity(seriesDTO, series, user);
        series.setContentType("SERIES");
        series.setNumberOfSeasons(seriesDTO.getNumberOfSeasons());
        series.setNumberOfEpisodes(seriesDTO.getNumberOfEpisodes());
        series.setIsCompleted(seriesDTO.getIsCompleted());
        log.info("Series mapped with title: {}, seasons: {}", series.getTitle(), series.getNumberOfSeasons());

        Series savedSeries = seriesRepository.save(series);
        log.info("Series saved successfully with ID: {}", savedSeries.getId());
        return mapToSeriesDTO(savedSeries);
    }

    @Override
    @Transactional
    public DocumentaryDTO createDocumentary(DocumentaryDTO documentaryDTO, String username) {
        log.info("Creating documentary: {}", documentaryDTO.getTitle());
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> createAnonymousUserIfNeeded(username));
        log.info("Documentary user: {}", user.getUsername());

        Documentary documentary = new Documentary();
        mapCommonFieldsToEntity(documentaryDTO, documentary, user);
        documentary.setContentType("DOCUMENTARY");
        documentary.setTopic(documentaryDTO.getTopic());
        documentary.setNarrator(documentaryDTO.getNarrator());
        log.info("Documentary mapped with title: {}, topic: {}", documentary.getTitle(), documentary.getTopic());

        Documentary savedDoc = documentaryRepository.save(documentary);
        log.info("Documentary saved successfully with ID: {}", savedDoc.getId());
        return mapToDocumentaryDTO(savedDoc);
    }

    @Override
    public ContentDTO getContentById(String id) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found: " + id));
        return mapToDTO(content);
    }

    @Override
    public List<ContentDTO> getAllContent() {
        try {
            log.info("Fetching all content");
            List<Content> allContent = contentRepository.findAll();
            log.info("Retrieved {} content items from database", allContent.size());

            List<ContentDTO> result = allContent.stream()
                    .map(this::mapToDTO)
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            log.info("Mapped to {} DTOs", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error fetching content: {}", e.getMessage());
            log.debug("Full error:", e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<ContentAnalyticsDTO> getContentAnalytics(String category, String genreKeyword, int limit) {
        return contentRepository.findContentAnalytics(category, genreKeyword, limit);
    }

    @Override
    public List<ContentAnalyticsDTO> getTop10Content(String category, String genreKeyword) {
        return contentRepository.findContentAnalytics(category, genreKeyword, 10);
    }

    @Override
    public List<ContentAnalyticsDTO> getTop5Content() {
        log.info("Getting top 5 content");
        try {
            List<Content> contents = contentRepository.findAll().stream()
                    .filter(content -> content.getStatus() == ContentStatus.PUBLISHED && content.getVisible())
                    .toList();

            log.info("Found {} published and visible contents", contents.size());
            if (contents.isEmpty()) {
                return List.of();
            }

            // Get reservation counts
            Map<String, Long> reservationCounts = reservationRepository.findAll().stream()
                    .filter(reservation -> reservation.getContenuId() != null && !reservation.getContenuId().isBlank())
                    .collect(Collectors.groupingBy(Reservation::getContenuId, Collectors.counting()));

            log.info("Processing {} contents for analytics", contents.size());
            List<ContentAnalyticsDTO> result = contents.stream()
                    .map(content -> {
                        try {
                            Long reservationCount = reservationCounts.getOrDefault(content.getId(), 0L);

                            // Calculate engagement score: viewCount * 0.7 + commentsCount * 3.0
                            int viewCount = content.getViewCount();
                            int commentsCount = content.getComments() != null ? content.getComments().size() : 0;
                            double engagementScore = (viewCount * 0.7d) + (commentsCount * 3.0d);

                            log.debug("Processing content: {} with viewCount: {}, commentsCount: {}, engagementScore: {}",
                                     content.getTitle(), viewCount, commentsCount, engagementScore);

                            return ContentAnalyticsDTO.builder()
                                    .contentId(content.getId())
                                    .title(content.getTitle())
                                    .category(content.getCategory())
                                    .genres(content.getGenreIds() != null ?
                                        content.getGenreIds().stream()
                                            .map(id -> {
                                                try {
                                                    return genreRepository.findById(id).map(Genre::getName).orElse("Unknown");
                                                } catch (Exception e) {
                                                    log.warn("Error getting genre name for id {}: {}", id, e.getMessage());
                                                    return "Unknown";
                                                }
                                            })
                                            .collect(Collectors.toList()) : List.of())
                                    .viewCount(viewCount)
                                    .commentsCount(commentsCount)
                                    .engagementScore(engagementScore)
                                    .build();
                        } catch (Exception e) {
                            log.error("Error processing content {}: {}", content.getId(), e.getMessage(), e);
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .sorted(Comparator.comparingDouble(ContentAnalyticsDTO::getEngagementScore).reversed()
                            .thenComparing(ContentAnalyticsDTO::getViewCount, Comparator.reverseOrder()))
                    .limit(5)
                    .toList();

            log.info("Successfully processed top 5 content, returning {} items", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error in getTop5Content: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public List<ContentRecommendationDTO> getContentRecommendations(String userId, int limit) {
        List<Content> contents = contentRepository.findAll();
        if (contents.isEmpty()) {
            return List.of();
        }

        try {
            List<ContentRecommendationDTO> aiRecommendations = callAiRecommendations(userId, contents, limit);
            if (!aiRecommendations.isEmpty()) {
                return aiRecommendations;
            }
        } catch (Exception e) {
            log.warn("AI recommendation service unavailable, using local fallback: {}", e.getMessage());
        }

        Map<String, ContentAnalyticsDTO> analyticsByContentId = contentRepository.findContentAnalytics(null, null, Math.max(contents.size(), 1))
                .stream()
                .collect(Collectors.toMap(ContentAnalyticsDTO::getContentId, item -> item, (left, right) -> left));

        Map<String, Long> reservationCounts = reservationRepository.findAll().stream()
                .filter(reservation -> reservation.getContenuId() != null && !reservation.getContenuId().isBlank())
                .collect(Collectors.groupingBy(Reservation::getContenuId, Collectors.counting()));

        Set<String> preferredGenres = resolvePreferredGenres(userId, contents);
        LocalDateTime now = LocalDateTime.now();

        return contents.stream()
                .map(content -> toRecommendation(content, analyticsByContentId.get(content.getId()), reservationCounts, preferredGenres, now))
                .sorted(Comparator.comparingDouble(ContentRecommendationDTO::getRecommendationScore).reversed()
                        .thenComparing(ContentRecommendationDTO::getTitle, String.CASE_INSENSITIVE_ORDER))
                .limit(Math.max(1, limit))
                .toList();
    }

    @Override
    public List<ContentRecommendationDTO> getDynamicContentRecommendations(Map<String, Object> preferences) {
        log.info("Getting dynamic recommendations based on Q&A answers");
        List<Content> contents = contentRepository.findAll();
        if (contents.isEmpty()) {
            return List.of();
        }

        try {
            // Call AI service with dynamic preferences from Q&A answers
            List<ContentRecommendationDTO> aiRecommendations = callAiRecommendationsWithDynamicPreferences(preferences, contents, 6);
            if (!aiRecommendations.isEmpty()) {
                log.info("Returning {} dynamic AI recommendations", aiRecommendations.size());
                return aiRecommendations;
            }
        } catch (Exception e) {
            log.warn("AI recommendation service unavailable for dynamic preferences, using fallback: {}", e.getMessage());
        }

        // Fallback to analytics-based recommendations if AI service unavailable
        return getContentRecommendations(null, 6);
    }

    @Override
    public List<ContentSearchResultDTO> searchContentAdvanced(String keyword, String genreKeyword, String category, int limit) {
        return contentRepository.advancedKeywordSearch(keyword, genreKeyword, category, limit);
    }

    @Override
    public PageResponseDTO<ContentDTO> getAllContentPaginated(int page, int size, String search, String categoryId, String sortBy, String sortDirection) {
        try {
            // Get all content from ContentRepository
            List<ContentDTO> allContent = contentRepository.findAll().stream()
                    .map(this::mapToDTO)
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            // Filter by search query
            if (search != null && !search.isEmpty()) {
                String searchLower = search.toLowerCase();
                allContent = allContent.stream()
                        .filter(c -> c.getTitle().toLowerCase().contains(searchLower) ||
                                (c.getDescription() != null && c.getDescription().toLowerCase().contains(searchLower)))
                        .collect(Collectors.toList());
            }

            // Filter by category
            if (categoryId != null && !categoryId.isEmpty()) {
                try {
                    ContentCategory category = ContentCategory.fromString(categoryId);
                    allContent = allContent.stream()
                            .filter(c -> c.getCategory() == category)
                            .collect(Collectors.toList());
                } catch (IllegalArgumentException e) {
                    // Invalid category - return empty response
                    return PageResponseDTO.<ContentDTO>builder()
                            .content(new ArrayList<>())
                            .page(page)
                            .size(size)
                            .totalElements(0)
                            .totalPages(0)
                            .first(true)
                            .last(true)
                            .numberOfElements(0)
                            .hasNext(false)
                            .hasPrevious(false)
                            .build();
                }
            }

            // Sort results
            if (sortBy != null && !sortBy.isEmpty()) {
                boolean ascending = sortDirection == null || "ASC".equalsIgnoreCase(sortDirection);
                if ("title".equalsIgnoreCase(sortBy)) {
                    allContent.sort((a, b) -> ascending ? a.getTitle().compareTo(b.getTitle()) : b.getTitle().compareTo(a.getTitle()));
                } else if ("releaseDate".equalsIgnoreCase(sortBy)) {
                    allContent.sort((a, b) -> {
                        if (a.getReleaseDate() == null || b.getReleaseDate() == null) return 0;
                        return ascending ? a.getReleaseDate().compareTo(b.getReleaseDate()) : b.getReleaseDate().compareTo(a.getReleaseDate());
                    });
                }
            }

            // Paginate results
            int totalElements = allContent.size();
            int totalPages = (int) Math.ceil((double) totalElements / size);
            int startIndex = Math.min(page * size, totalElements);
            int endIndex = Math.min((page + 1) * size, totalElements);

            List<ContentDTO> pageContent = allContent.subList(startIndex, endIndex);

            return PageResponseDTO.<ContentDTO>builder()
                    .content(pageContent)
                    .page(page)
                    .size(size)
                    .totalElements(totalElements)
                    .totalPages(totalPages)
                    .first(page == 0)
                    .last(page >= totalPages - 1)
                    .numberOfElements(pageContent.size())
                    .hasNext(page < totalPages - 1)
                    .hasPrevious(page > 0)
                    .build();
        } catch (Exception e) {
            log.error("Error fetching paginated content: {}", e.getMessage());
            return PageResponseDTO.<ContentDTO>builder()
                    .content(new ArrayList<>())
                    .page(page)
                    .size(size)
                    .totalElements(0)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .numberOfElements(0)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }
    }

    @Override
    @Transactional
    public FilmDTO updateFilm(String id, FilmDTO filmDTO) {
        Film film = filmRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Film not found: " + id));

        film.setTitle(filmDTO.getTitle());
        film.setDescription(filmDTO.getDescription());
        film.setReleaseDate(filmDTO.getReleaseDate());
        film.setPublishAt(filmDTO.getPublishAt() != null ? filmDTO.getPublishAt() : filmDTO.getReleaseDate());
        film.setExpireAt(filmDTO.getExpireAt());
        film.setCategory(filmDTO.getCategory());
        film.setGenreIds(filmDTO.getGenreIds() != null ? filmDTO.getGenreIds() : new ArrayList<>());
        film.setViewCount(filmDTO.getViewCount() != null ? filmDTO.getViewCount() : 0);
        film.setDurationInMinutes(filmDTO.getDurationInMinutes());
        film.setDirector(filmDTO.getDirector());

        initializeLifecycleState(film, filmDTO.getStatus());

        return mapToFilmDTO(filmRepository.save(film));
    }

    @Override
    @Transactional
    public SeriesDTO updateSeries(String id, SeriesDTO seriesDTO) {
        Series series = seriesRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Series not found: " + id));

        series.setTitle(seriesDTO.getTitle());
        series.setDescription(seriesDTO.getDescription());
        series.setReleaseDate(seriesDTO.getReleaseDate());
        series.setPublishAt(seriesDTO.getPublishAt() != null ? seriesDTO.getPublishAt() : seriesDTO.getReleaseDate());
        series.setExpireAt(seriesDTO.getExpireAt());
        series.setCategory(seriesDTO.getCategory());
        series.setGenreIds(seriesDTO.getGenreIds() != null ? seriesDTO.getGenreIds() : new ArrayList<>());
        series.setViewCount(seriesDTO.getViewCount() != null ? seriesDTO.getViewCount() : 0);
        series.setNumberOfSeasons(seriesDTO.getNumberOfSeasons());
        series.setNumberOfEpisodes(seriesDTO.getNumberOfEpisodes());
        series.setIsCompleted(seriesDTO.getIsCompleted());

        initializeLifecycleState(series, seriesDTO.getStatus());

        return mapToSeriesDTO(seriesRepository.save(series));
    }

    @Override
    @Transactional
    public DocumentaryDTO updateDocumentary(String id, DocumentaryDTO documentaryDTO) {
        Documentary doc = documentaryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Documentary not found: " + id));

        doc.setTitle(documentaryDTO.getTitle());
        doc.setDescription(documentaryDTO.getDescription());
        doc.setReleaseDate(documentaryDTO.getReleaseDate());
        doc.setPublishAt(documentaryDTO.getPublishAt() != null ? documentaryDTO.getPublishAt() : documentaryDTO.getReleaseDate());
        doc.setExpireAt(documentaryDTO.getExpireAt());
        doc.setCategory(documentaryDTO.getCategory());
        doc.setGenreIds(documentaryDTO.getGenreIds() != null ? documentaryDTO.getGenreIds() : new ArrayList<>());
        doc.setViewCount(documentaryDTO.getViewCount() != null ? documentaryDTO.getViewCount() : 0);
        doc.setTopic(documentaryDTO.getTopic());
        doc.setNarrator(documentaryDTO.getNarrator());

        initializeLifecycleState(doc, documentaryDTO.getStatus());

        return mapToDocumentaryDTO(documentaryRepository.save(doc));
    }

    @Override
    @Transactional
    public void deleteContent(String id) {
        // Try to delete from each repository
        if (filmRepository.existsById(id)) {
            filmRepository.deleteById(id);
        } else if (seriesRepository.existsById(id)) {
            seriesRepository.deleteById(id);
        } else if (documentaryRepository.existsById(id)) {
            documentaryRepository.deleteById(id);
        } else {
            throw new ResourceNotFoundException("Content not found: " + id);
        }
    }

    private Set<String> resolvePreferredGenres(String userId, List<Content> contents) {
        Set<String> preferredGenres = new HashSet<>();

        if (userId != null && !userId.isBlank()) {
            reservationRepository.findByUserId(userId).forEach(reservation ->
                    contents.stream()
                            .filter(content -> content.getId().equals(reservation.getContenuId()))
                            .findFirst()
                            .ifPresent(content -> preferredGenres.addAll(content.getGenreIds())));
        }

        if (preferredGenres.isEmpty()) {
            contents.forEach(content -> preferredGenres.addAll(content.getGenreIds()));
        }

        return preferredGenres;
    }

    private List<ContentRecommendationDTO> callAiRecommendations(String userId, List<Content> contents, int limit) throws Exception {
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

    private List<ContentRecommendationDTO> callAiRecommendationsWithDynamicPreferences(Map<String, Object> preferences, List<Content> contents, int limit) throws Exception {
        log.info("Calling AI service with dynamic preferences from Q&A answers");
        
        // Extract preferences from the payload
        Map<String, Object> userPreferences = (Map<String, Object>) preferences.get("user");
        if (userPreferences == null) {
            userPreferences = new HashMap<>();
        }

        // Build AI payload with dynamic preferences
        Map<String, Object> payload = new HashMap<>();
        payload.put("limit", Math.max(1, limit));
        
        // Use the Q&A preferences directly, with fallback defaults
        Map<String, Object> profile = new HashMap<>();
        profile.put("preferredCategories", userPreferences.getOrDefault("preferredCategories", new ArrayList<>()));
        profile.put("preferredTypes", userPreferences.getOrDefault("preferredTypes", new ArrayList<>()));
        profile.put("preferredGenres", userPreferences.getOrDefault("preferredGenres", new ArrayList<>()));
        
        payload.put("user", profile);
        payload.put("contents", contents.stream().map(this::toAiContentPayload).collect(Collectors.toList()));

        String requestBody = objectMapper.writeValueAsString(payload);
        log.debug("Sending to AI service: {}", requestBody);
        
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
        log.info("AI service returned {} recommendations for dynamic preferences", responseItems.size());
        return responseItems.stream()
                .map(this::mapAiRecommendation)
                .collect(Collectors.toList());
    }

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
                        preferredTypes.add(resolveContentType(content));
                        preferredGenres.addAll(content.getGenreIds());
                    }));
        }

        if (preferredCategories.isEmpty()) {
            contents.stream()
                    .map(Content::getCategory)
                    .filter(category -> category != null)
                    .map(Enum::name)
                    .forEach(preferredCategories::add);
        }

        if (preferredTypes.isEmpty()) {
            contents.stream().map(this::resolveContentType).forEach(preferredTypes::add);
        }

        if (preferredGenres.isEmpty()) {
            contents.forEach(content -> preferredGenres.addAll(content.getGenreIds()));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("preferredCategories", new ArrayList<>(preferredCategories));
        profile.put("preferredTypes", new ArrayList<>(preferredTypes));
        profile.put("preferredGenres", new ArrayList<>(preferredGenres));
        return profile;
    }

    private Map<String, Object> toAiContentPayload(Content content) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("contentId", content.getId());
        payload.put("title", content.getTitle());
        payload.put("description", content.getDescription());
        payload.put("category", content.getCategory() != null ? content.getCategory().name() : "MOVIE");
        payload.put("contentType", resolveContentType(content));
        payload.put("genres", content.getGenreIds() != null ? new ArrayList<>(content.getGenreIds()) : List.of());
        payload.put("viewCount", content.getViewCount() != null ? content.getViewCount() : 0);
        payload.put("publishAt", content.getPublishAt() != null ? content.getPublishAt().toString() : null);
        payload.put("releaseDate", content.getReleaseDate() != null ? content.getReleaseDate().toString() : null);
        payload.put("status", content.getStatus() != null ? content.getStatus().name() : null);
        return payload;
    }

    private ContentRecommendationDTO mapAiRecommendation(Map<String, Object> item) {
        String categoryValue = item.get("category") != null ? String.valueOf(item.get("category")) : "MOVIE";
        ContentCategory category;
        try {
            category = ContentCategory.valueOf(categoryValue.toUpperCase());
        } catch (Exception ignored) {
            category = ContentCategory.MOVIE;
        }

        Integer viewCount = item.get("viewCount") != null ? ((Number) item.get("viewCount")).intValue() : 0;
        Double recommendationScore = item.get("recommendationScore") != null
                ? ((Number) item.get("recommendationScore")).doubleValue()
                : 0.0d;
        Double engagementScore = item.get("engagementScore") != null
                ? ((Number) item.get("engagementScore")).doubleValue()
                : recommendationScore;

        List<String> genres = new ArrayList<>();
        Object rawGenres = item.get("genres");
        if (rawGenres instanceof List<?> list) {
            for (Object value : list) {
                if (value != null) {
                    genres.add(String.valueOf(value));
                }
            }
        }

        return ContentRecommendationDTO.builder()
                .contentId(item.get("contentId") != null ? String.valueOf(item.get("contentId")) : null)
                .title(item.get("title") != null ? String.valueOf(item.get("title")) : "Untitled")
                .description(item.get("description") != null ? String.valueOf(item.get("description")) : null)
                .category(category)
                .genres(genres)
                .viewCount(viewCount)
                .engagementScore(engagementScore)
                .recommendationScore(recommendationScore)
                .reason(item.get("reason") != null ? String.valueOf(item.get("reason")) : "AI-ranked recommendation")
                .build();
    }

    private String resolveContentType(Content content) {
        if (content instanceof Film) {
            return "FILM";
        }
        if (content instanceof Series) {
            return "SERIES";
        }
        if (content instanceof Documentary) {
            return "DOCUMENTARY";
        }
        return content.getContentType() != null ? content.getContentType() : "UNKNOWN";
    }

    private ContentRecommendationDTO toRecommendation(Content content,
                                                       ContentAnalyticsDTO analytics,
                                                       Map<String, Long> reservationCounts,
                                                       Set<String> preferredGenres,
                                                       LocalDateTime now) {
        int viewCount = content.getViewCount() == null ? 0 : content.getViewCount();
        double engagementScore = analytics != null ? analytics.getEngagementScore() : viewCount * 0.7d;
        double popularityScore = Math.log1p(viewCount) * 8.0d;
        double reservationScore = reservationCounts.getOrDefault(content.getId(), 0L) * 6.0d;
        double genreMatchScore = content.getGenreIds().stream().anyMatch(preferredGenres::contains)
                ? 15.0d
                : Math.min(content.getGenreIds().size(), 3) * 2.0d;
        double freshnessScore = computeFreshnessScore(content, now);

        double recommendationScore = engagementScore + popularityScore + reservationScore + genreMatchScore + freshnessScore;

        return ContentRecommendationDTO.builder()
                .contentId(content.getId())
                .title(content.getTitle())
                .description(content.getDescription())
                .category(content.getCategory())
                .genres(new ArrayList<>(content.getGenreIds()))
                .viewCount(viewCount)
                .engagementScore(engagementScore)
                .recommendationScore(recommendationScore)
                .reason(buildRecommendationReason(content, reservationCounts, preferredGenres, freshnessScore))
                .build();
    }

    private double computeFreshnessScore(Content content, LocalDateTime now) {
        LocalDateTime referenceDate = content.getPublishAt() != null ? content.getPublishAt() : content.getReleaseDate();
        if (referenceDate == null) {
            return 0.0d;
        }

        long ageDays = ChronoUnit.DAYS.between(referenceDate, now);
        if (ageDays <= 0) {
            return 12.0d;
        }
        if (ageDays <= 30) {
            return 10.0d;
        }
        if (ageDays <= 180) {
            return 6.0d;
        }
        if (ageDays <= 730) {
            return 3.0d;
        }
        return 1.0d;
    }

    private String buildRecommendationReason(Content content,
                                             Map<String, Long> reservationCounts,
                                             Set<String> preferredGenres,
                                             double freshnessScore) {
        List<String> reasons = new ArrayList<>();
        if ((content.getViewCount() != null ? content.getViewCount() : 0) >= 1000) {
            reasons.add("high viewer demand");
        }
        if (reservationCounts.getOrDefault(content.getId(), 0L) > 0) {
            reasons.add("strong reservation activity");
        }
        if (content.getGenreIds().stream().anyMatch(preferredGenres::contains)) {
            reasons.add("matches preferred genres");
        }
        if (freshnessScore >= 10.0d) {
            reasons.add("recent release");
        }
        if (reasons.isEmpty()) {
            reasons.add("balanced content profile");
        }
        return String.join(", ", reasons);
    }

    /**
     * Create an anonymous user if it doesn't exist
     * WHY: Allows unauthenticated users to create content (public API)
     * @param username Username to create (typically "anonymous")
     * @return User object (existing or newly created)
     */
    private User createAnonymousUserIfNeeded(String username) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(username);
                    newUser.setEmail(username + "@system.local");
                    newUser.setPassword(""); // System user - no password auth
                    newUser.setEnabled(true);
                    return userRepository.save(newUser);
                });
    }

    private void mapCommonFieldsToEntity(ContentDTO dto, Content entity, User user) {
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setReleaseDate(dto.getReleaseDate());
        entity.setPublishAt(dto.getPublishAt() != null ? dto.getPublishAt() : dto.getReleaseDate());
        entity.setExpireAt(dto.getExpireAt());
        entity.setCategory(dto.getCategory());
        entity.setAddedBy(user);
        entity.setGenreIds(dto.getGenreIds() != null ? dto.getGenreIds() : new ArrayList<>());
        entity.setViewCount(dto.getViewCount() != null ? dto.getViewCount() : 0);

        initializeLifecycleState(entity, dto.getStatus());
    }

    private void mapCommonFieldsToDTO(Content entity, ContentDTO dto) {
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setReleaseDate(entity.getReleaseDate());
        dto.setPublishAt(entity.getPublishAt());
        dto.setExpireAt(entity.getExpireAt());
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setCategory(entity.getCategory());
        dto.setGenreIds(entity.getGenreIds() != null ? entity.getGenreIds() : new ArrayList<>());
        dto.setStatus(entity.getStatus());
        dto.setVisible(entity.getVisible());
        dto.setViewCount(entity.getViewCount() != null ? entity.getViewCount() : 0);
        
        // Safely handle AddedBy User (null check)
        if (entity.getAddedBy() != null) {
            dto.setAddedById(entity.getAddedBy().getId());
            dto.setAddedByUsername(entity.getAddedBy().getUsername());
        }
    }

    private void initializeLifecycleState(Content entity, ContentStatus requestedStatus) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime publishAt = entity.getPublishAt();

        if (requestedStatus != null) {
            entity.setStatus(requestedStatus);
            if (requestedStatus == ContentStatus.PUBLISHED) {
                entity.setVisible(Boolean.TRUE);
                if (entity.getPublishedAt() == null) {
                    entity.setPublishedAt(now);
                }
            } else {
                entity.setVisible(Boolean.FALSE);
            }
            return;
        }

        if (publishAt != null && publishAt.isAfter(now)) {
            entity.setStatus(ContentStatus.SCHEDULED);
            entity.setVisible(Boolean.FALSE);
            return;
        }

        entity.setStatus(ContentStatus.PUBLISHED);
        entity.setVisible(Boolean.TRUE);
        if (entity.getPublishedAt() == null) {
            entity.setPublishedAt(now);
        }
    }

    private ContentDTO mapToDTO(Content content) {
        if (content instanceof Film) return mapToFilmDTO((Film) content);
        if (content instanceof Series) return mapToSeriesDTO((Series) content);
        if (content instanceof Documentary) return mapToDocumentaryDTO((Documentary) content);
        return null;
    }

    private FilmDTO mapToFilmDTO(Film film) {
        FilmDTO dto = new FilmDTO();
        mapCommonFieldsToDTO(film, dto);
        dto.setDurationInMinutes(film.getDurationInMinutes());
        dto.setDirector(film.getDirector());
        dto.setContentType("FILM");
        return dto;
    }

    private SeriesDTO mapToSeriesDTO(Series series) {
        SeriesDTO dto = new SeriesDTO();
        mapCommonFieldsToDTO(series, dto);
        dto.setNumberOfSeasons(series.getNumberOfSeasons());
        dto.setNumberOfEpisodes(series.getNumberOfEpisodes());
        dto.setIsCompleted(series.getIsCompleted());
        dto.setContentType("SERIES");
        return dto;
    }

    private DocumentaryDTO mapToDocumentaryDTO(Documentary doc) {
        DocumentaryDTO dto = new DocumentaryDTO();
        mapCommonFieldsToDTO(doc, dto);
        dto.setTopic(doc.getTopic());
        dto.setNarrator(doc.getNarrator());
        dto.setContentType("DOCUMENTARY");
        return dto;
    }
}
