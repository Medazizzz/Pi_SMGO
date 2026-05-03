package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "recommendation_cache")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationCache {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;            // un seul cache par user

    private String recommande;
    private int    matchBasic;
    private int    matchPremium;
    private int    matchElite;
    private double scoreNormalise;
    private double churnRisk;
    private double totalDepense;
    private List<String> raisons;

    private LocalDateTime calculatedAt;

    @Indexed(expireAfterSeconds = 86400) // ← TTL 24h — MongoDB supprime auto
    private LocalDateTime expireAt;
}