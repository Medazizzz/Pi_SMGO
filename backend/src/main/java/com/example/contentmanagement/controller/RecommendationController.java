package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.RecommendationResult;
import com.example.contentmanagement.dto.recommendation.UserBehaviorProfile;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.recommendation.MlRecommendationService;
import com.example.contentmanagement.service.recommendation.UserBehaviorAnalyzer;
import com.example.contentmanagement.service.scheduler.RecommendationScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final MlRecommendationService mlService;       // ✅ ML remplace l'ancien service
    private final UserBehaviorAnalyzer analyzer;
    private final UserRepository userRepo;
    private final RecommendationScheduler recommendationScheduler;

    // ── Recommandation ML ──────────────────────────────
    @GetMapping("/{userId}")
    public ResponseEntity<RecommendationResult> getRecommendation(
            @PathVariable String userId) {
        return ResponseEntity.ok(mlService.recommend(userId));
    }

    // ── Profil comportemental ──────────────────────────
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserBehaviorProfile> getProfile(
            @PathVariable String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(analyzer.analyze(user));
    }

    // ── Forcer recalcul d'un seul user ────────────────
    @PostMapping("/recalculate/{userId}")
    public ResponseEntity<RecommendationResult> forceRecalculate(
            @PathVariable String userId) {
        return ResponseEntity.ok(mlService.recommend(userId));
    }

    // ── Déclencher le scheduler manuellement ──────────
    @PostMapping("/scheduler/run")
    public ResponseEntity<String> runScheduler() {
        recommendationScheduler.runManually();
        return ResponseEntity.ok("✅ Scheduler exécuté !");
    }
}