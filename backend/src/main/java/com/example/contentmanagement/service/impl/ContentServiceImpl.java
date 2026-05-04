package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.*;
import com.example.contentmanagement.entity.*;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.FilmRepository;
import com.example.contentmanagement.repository.SeriesRepository;
import com.example.contentmanagement.repository.DocumentaryRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.ContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.ArrayList;
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
        film.setCategory(filmDTO.getCategory());
        film.setGenreIds(filmDTO.getGenreIds() != null ? filmDTO.getGenreIds() : new ArrayList<>());
        film.setDurationInMinutes(filmDTO.getDurationInMinutes());
        film.setDirector(filmDTO.getDirector());

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
        series.setCategory(seriesDTO.getCategory());
        series.setGenreIds(seriesDTO.getGenreIds() != null ? seriesDTO.getGenreIds() : new ArrayList<>());
        series.setNumberOfSeasons(seriesDTO.getNumberOfSeasons());
        series.setNumberOfEpisodes(seriesDTO.getNumberOfEpisodes());
        series.setIsCompleted(seriesDTO.getIsCompleted());

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
        doc.setCategory(documentaryDTO.getCategory());
        doc.setGenreIds(documentaryDTO.getGenreIds() != null ? documentaryDTO.getGenreIds() : new ArrayList<>());
        doc.setTopic(documentaryDTO.getTopic());
        doc.setNarrator(documentaryDTO.getNarrator());

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
        entity.setCategory(dto.getCategory());
        entity.setAddedBy(user);
        entity.setGenreIds(dto.getGenreIds() != null ? dto.getGenreIds() : new ArrayList<>());
    }

    private void mapCommonFieldsToDTO(Content entity, ContentDTO dto) {
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setReleaseDate(entity.getReleaseDate());
        dto.setCategory(entity.getCategory());
        dto.setGenreIds(entity.getGenreIds() != null ? entity.getGenreIds() : new ArrayList<>());
        
        // Safely handle AddedBy User (null check)
        if (entity.getAddedBy() != null) {
            dto.setAddedById(entity.getAddedBy().getId());
            dto.setAddedByUsername(entity.getAddedBy().getUsername());
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
