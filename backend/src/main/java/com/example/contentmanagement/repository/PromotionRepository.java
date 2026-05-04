package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Promotion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends MongoRepository<Promotion, String> {
    List<Promotion> findByClientId(String clientId);
    Optional<Promotion> findByCode(String code);
    List<Promotion> findByActiveTrue();
}
