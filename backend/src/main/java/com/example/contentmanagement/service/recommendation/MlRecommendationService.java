package com.example.contentmanagement.service.recommendation;

import com.example.contentmanagement.dto.recommendation.MlRequest;
import com.example.contentmanagement.dto.recommendation.MlResponse;
import com.example.contentmanagement.dto.RecommendationResult;
import com.example.contentmanagement.dto.recommendation.UserBehaviorProfile;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MlRecommendationService {

    private final UserRepository userRepo;
    private final UserBehaviorAnalyzer analyzer;
    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public RecommendationResult recommend(String userId) {

        // ── Étape 1 : récupérer le user ───────────────
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // ── Étape 2 : analyser comportement ───────────
        UserBehaviorProfile profile = analyzer.analyze(user);

        // ── Étape 3 : construire requête ML ───────────
        MlRequest request = MlRequest.builder()
                .totalSpent(profile.getTotalDepense())
                .nbSubscriptions(profile.getNbAbonnements())
                .fidelityScore(profile.getFidelityScore())
                .senioritDays(profile.getAncienneteJours())
                .nbReservations(profile.getNbReservations())
                .nbPromosUsed(profile.getNbPromosUtilisees())
                .recentlyActive(profile.isActifRecemment() ? 1 : 0)
                .dominantTypeEnc(encodeType(profile.getTypeDominant()))
                .fidelityLevelEnc(encodeLevel(profile.getFidelityLevel()))
                .churnRisk(profile.getChurnRisk())
                .upgradeTrend(profile.getTendanceGamme())
                .build();

        // ── Étape 4 : appeler FastAPI ──────────────────
        MlResponse mlResponse = restTemplate.postForObject(
                mlServiceUrl + "/predict",
                request,
                MlResponse.class
        );

        log.info("🤖 ML Prédiction pour [{}] → {} | probabilités: {}",
                userId,
                mlResponse.getRecommande(),
                mlResponse.getProbabilites()
        );

        // ── Étape 5 : construire le résultat ──────────
        return RecommendationResult.builder()
                .userId(userId)
                .recommande(mlResponse.getRecommande())
                .matchBasic(mlResponse.getProbabilites()
                        .getOrDefault("BASIC", 0.0).intValue())
                .matchPremium(mlResponse.getProbabilites()
                        .getOrDefault("PREMIUM", 0.0).intValue())
                .matchElite(mlResponse.getProbabilites()
                        .getOrDefault("ELITE", 0.0).intValue())
                .totalDepense(profile.getTotalDepense())
                .frequence(profile.getFrequenceAbonnement())
                .tendanceGamme(profile.getTendanceGamme())
                .churnRisk(profile.getChurnRisk())
                .ancienneteJours(profile.getAncienneteJours())
                .actifRecemment(profile.isActifRecemment())
                .typeDominant(profile.getTypeDominant())
                .nbReservations(profile.getNbReservations())
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    // ── Encodage type dominant ─────────────────────
    private int encodeType(String type) {
        if (type == null) return 0;
        return switch (type) {
            case "PREMIUM" -> 1;
            case "ELITE"   -> 2;
            default        -> 0;
        };
    }

    // ── Encodage niveau fidélité ───────────────────
    private int encodeLevel(String level) {
        if (level == null) return 0;
        return switch (level) {
            case "SILVER" -> 1;
            case "GOLD"   -> 2;
            default       -> 0;
        };
    }
}