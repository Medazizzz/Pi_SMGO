package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.KidsContentDTO;
import com.example.contentmanagement.entity.KidsContent;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.KidsContentRepository;
import com.example.contentmanagement.service.KidsContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Kids Content Service Implementation
 * WHY: Implements kids content business logic
 * Handles CRUD operations and filtering for kid-friendly content
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KidsContentServiceImpl implements KidsContentService {

    private final KidsContentRepository kidsContentRepository;

    @Override
    public List<KidsContentDTO> getAllContent() {
        log.info("Fetching all kids content");
        return kidsContentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> getFeaturedContent() {
        log.info("Fetching featured kids content");
        return kidsContentRepository.findByFeaturedTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> getContentByAgeGroup(String ageGroup) {
        log.info("Fetching kids content for age group: {}", ageGroup);
        return kidsContentRepository.findByAgeGroup(ageGroup).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> getContentByType(String contentType) {
        log.info("Fetching kids content by type: {}", contentType);
        return kidsContentRepository.findByContentType(contentType).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> getEducationalContent() {
        log.info("Fetching educational kids content");
        return kidsContentRepository.findByIsEducationalTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> searchContent(String query) {
        log.info("Searching kids content with query: {}", query);
        return kidsContentRepository.searchContent(query).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<KidsContentDTO> getContentById(String id) {
        log.info("Fetching kids content with id: {}", id);
        return kidsContentRepository.findById(id)
                .map(this::toDTO);
    }

    @Override
    public KidsContentDTO createContent(KidsContentDTO dto) {
        log.info("Creating new kids content: {}", dto.getTitle());
        KidsContent content = KidsContent.builder()
                .id(UUID.randomUUID().toString())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .ageGroup(dto.getAgeGroup())
                .contentType(dto.getContentType())
                .rating(dto.getRating())
                .duration(dto.getDuration())
                .image(dto.getImage())
                .thumbnail(dto.getThumbnail())
                .genre(dto.getGenre())
                .isEducational(dto.getIsEducational())
                .releasedYear(dto.getReleasedYear())
                .featured(dto.getFeatured())
                .build();

        content.preSave();
        KidsContent saved = kidsContentRepository.save(content);
        log.info("Kids content created with id: {}", saved.getId());
        return toDTO(saved);
    }

    @Override
    public KidsContentDTO updateContent(String id, KidsContentDTO dto) {
        log.info("Updating kids content with id: {}", id);
        KidsContent content = kidsContentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kids content not found with id: " + id));

        content.setTitle(dto.getTitle());
        content.setDescription(dto.getDescription());
        content.setAgeGroup(dto.getAgeGroup());
        content.setContentType(dto.getContentType());
        content.setRating(dto.getRating());
        content.setDuration(dto.getDuration());
        content.setImage(dto.getImage());
        content.setThumbnail(dto.getThumbnail());
        content.setGenre(dto.getGenre());
        content.setIsEducational(dto.getIsEducational());
        content.setReleasedYear(dto.getReleasedYear());
        content.setFeatured(dto.getFeatured());

        content.preSave();
        KidsContent updated = kidsContentRepository.save(content);
        log.info("Kids content updated with id: {}", id);
        return toDTO(updated);
    }

    @Override
    public void deleteContent(String id) {
        log.info("Deleting kids content with id: {}", id);
        if (!kidsContentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Kids content not found with id: " + id);
        }
        kidsContentRepository.deleteById(id);
        log.info("Kids content deleted with id: {}", id);
    }

    @Override
    public List<KidsContentDTO> getRecentContent(int limit) {
        log.info("Fetching recent kids content, limit: {}", limit);
        return kidsContentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .limit(limit)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<KidsContentDTO> getContentByGenre(String genre) {
        log.info("Fetching kids content by genre: {}", genre);
        return kidsContentRepository.findByGenre(genre).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert KidsContent entity to DTO
     */
    private KidsContentDTO toDTO(KidsContent entity) {
        return KidsContentDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .ageGroup(entity.getAgeGroup())
                .contentType(entity.getContentType())
                .rating(entity.getRating())
                .duration(entity.getDuration())
                .image(entity.getImage())
                .thumbnail(entity.getThumbnail())
                .genre(entity.getGenre())
                .isEducational(entity.getIsEducational())
                .releasedYear(entity.getReleasedYear())
                .featured(entity.getFeatured())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
