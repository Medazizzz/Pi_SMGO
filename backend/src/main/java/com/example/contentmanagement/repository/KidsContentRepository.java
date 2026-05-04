package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.KidsContent;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Kids Content Repository (MongoDB)
 * WHY: Provides database access for kids content
 * Uses Spring Data MongoDB with custom queries
 */
@Repository
public interface KidsContentRepository extends MongoRepository<KidsContent, String> {

    /**
     * Find all content by age group
     */
    List<KidsContent> findByAgeGroup(String ageGroup);

    /**
     * Find all content by content type
     */
    List<KidsContent> findByContentType(String contentType);

    /**
     * Find all featured content
     */
    List<KidsContent> findByFeaturedTrue();

    /**
     * Find all educational content
     */
    List<KidsContent> findByIsEducationalTrue();

    /**
     * Find featured content by age group
     */
    List<KidsContent> findByAgeGroupAndFeaturedTrue(String ageGroup);

    /**
     * Search content by title, description, or genre (MongoDB regex)
     */
    @Query("{ $or: [ " +
            "{ 'title': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'genre': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<KidsContent> searchContent(String query);

    /**
     * Find content by genre
     */
    List<KidsContent> findByGenre(String genre);

    /**
     * Find recent content (sorted by created_at descending)
     */
    List<KidsContent> findAll(Sort sort);

    /**
     * Find by age group and type
     */
    List<KidsContent> findByAgeGroupAndContentType(String ageGroup, String contentType);

    /**
     * Find featured educational content
     */
    List<KidsContent> findByFeaturedTrueAndIsEducationalTrue();
}
