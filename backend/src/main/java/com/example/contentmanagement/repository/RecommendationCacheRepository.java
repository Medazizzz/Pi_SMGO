package com.example.contentmanagement.repository;


import com.example.contentmanagement.entity.RecommendationCache;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecommendationCacheRepository
        extends MongoRepository<RecommendationCache, String> {

    Optional<RecommendationCache> findByUserId(String userId);
    void deleteByUserId(String userId);
}