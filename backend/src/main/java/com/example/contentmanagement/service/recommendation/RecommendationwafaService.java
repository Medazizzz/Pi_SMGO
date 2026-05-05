package com.example.contentmanagement.service.recommendation;

import com.example.contentmanagement.dto.RecommendationResult;
import com.example.contentmanagement.dto.recommendation.ScoringResult;
import com.example.contentmanagement.dto.recommendation.UserBehaviorProfile;
import com.example.contentmanagement.entity.RecommendationCache;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.RecommendationCacheRepository;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationwafaService {

    private final UserRepository userRepo;
    private final UserBehaviorAnalyzer analyzer;
    private final MultiCriteriaScoring scoring;
    private final RecommendationCacheRepository cacheRepo;

    public RecommendationResult recommend(String userId) {

        // ── Étape 1 : vérifier le cache MongoDB ───────
        var cached = cacheRepo.findByUserId(userId);
        if (cached.isPresent()) {
            log.info("⚡ Cache HIT pour [{}] — résultat depuis MongoDB", userId);
            return fromCache(cached.get());
        }

        log.info("🔄 Cache MISS pour [{}] — calcul en cours...", userId);

        // ── Étape 2 : récupérer le user ───────────────
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // ── Étape 3 : analyser le comportement ────────
        UserBehaviorProfile profile = analyzer.analyze(user);

        // ── Étape 4 : scorer ──────────────────────────
        ScoringResult scoringResult = scoring.score(profile);

        // ── Étape 5 : sauvegarder en cache ────────────
        saveToCache(userId, profile, scoringResult);

        log.info("✅ Recommandation calculée pour [{}] → {}",
                userId, scoringResult.getRecommande());

        return buildResult(userId, profile, scoringResult);
    }

    // ── Forcer le recalcul (utilisé par le scheduler) ─
    public RecommendationResult recalculate(String userId) {
        cacheRepo.deleteByUserId(userId);   // invalider le cache
        return recommend(userId);           // recalculer
    }

    // ── Sauvegarder en MongoDB ─────────────────────────
    private void saveToCache(String userId,
                             UserBehaviorProfile profile,
                             ScoringResult scoringResult) {
        RecommendationCache cache = RecommendationCache.builder()
                .userId(userId)
                .recommande(scoringResult.getRecommande())
                .matchBasic(scoringResult.getMatchBasic())
                .matchPremium(scoringResult.getMatchPremium())
                .matchElite(scoringResult.getMatchElite())
                .scoreNormalise(scoringResult.getScoreNormalise())
                .churnRisk(profile.getChurnRisk())
                .totalDepense(profile.getTotalDepense())
                .raisons(scoringResult.getRaisons())
                .calculatedAt(LocalDateTime.now())
                .expireAt(LocalDateTime.now().plusHours(24)) // TTL 24h
                .build();

        // Upsert — remplacer si existe déjà
        cacheRepo.findByUserId(userId).ifPresent(c -> cache.setId(c.getId()));
        cacheRepo.save(cache);
        log.info("💾 Cache sauvegardé pour [{}]", userId);
    }

    // ── Construire RecommendationResult depuis le cache ─
    private RecommendationResult fromCache(RecommendationCache cache) {
        return RecommendationResult.builder()
                .userId(cache.getUserId())
                .recommande(cache.getRecommande())
                .matchBasic(cache.getMatchBasic())
                .matchPremium(cache.getMatchPremium())
                .matchElite(cache.getMatchElite())
                .scoreNormalise(cache.getScoreNormalise())
                .churnRisk(cache.getChurnRisk())
                .totalDepense(cache.getTotalDepense())
                .raisons(cache.getRaisons())
                .calculatedAt(cache.getCalculatedAt())
                .build();
    }

    // ── Construire RecommendationResult depuis le calcul ─
    private RecommendationResult buildResult(String userId,
                                             UserBehaviorProfile profile,
                                             ScoringResult scoringResult) {
        return RecommendationResult.builder()
                .userId(userId)
                .recommande(scoringResult.getRecommande())
                .matchBasic(scoringResult.getMatchBasic())
                .matchPremium(scoringResult.getMatchPremium())
                .matchElite(scoringResult.getMatchElite())
                .scoreNormalise(scoringResult.getScoreNormalise())
                .raisons(scoringResult.getRaisons())
                .totalDepense(profile.getTotalDepense())
                .frequence(profile.getFrequenceAbonnement())
                .tendanceGamme(profile.getTendanceGamme())
                .churnRisk(profile.getChurnRisk())
                .ancienneteJours(profile.getAncienneteJours())
                .actifRecemment(profile.isActifRecemment())
                .typeDominant(profile.getTypeDominant())
                .nbReservations(profile.getNbReservations())
                .nbPromosUtilisees(profile.getNbPromosUtilisees())
                .calculatedAt(LocalDateTime.now())
                .build();
    }
}