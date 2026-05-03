package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Promotion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends MongoRepository<Promotion, String> {

    List<Promotion> findByClientId(String clientId);       // ← existant, garder
    Optional<Promotion> findByCode(String code);           // ← existant, garder
    List<Promotion> findByActiveTrue();                    // ← existant, garder

    // ✅ REMPLACER les lignes 16-17 par ceci
    Long countByClientId(String clientId);                 // ← utilise clientId existant
}