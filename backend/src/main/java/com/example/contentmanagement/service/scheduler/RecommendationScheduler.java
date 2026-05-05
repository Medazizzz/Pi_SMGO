package com.example.contentmanagement.service.scheduler;

import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.recommendation.RecommendationwafaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationScheduler {

    private final UserRepository userRepo;
    private final RecommendationwafaService recommendationService;

    // ── Recalcul chaque nuit à 02h00 ──────────────────
    @Scheduled(cron = "0 0 2 * * *")
    public void recalculerToutesLesRecommandations() {
        List<User> users = userRepo.findAll();
        log.info("🌙 Scheduler nocturne — recalcul pour {} users", users.size());

        int success = 0;
        int errors  = 0;

        for (User user : users) {
            try {
                recommendationService.recalculate(user.getId());
                success++;
            } catch (Exception e) {
                log.error("❌ Erreur recalcul pour [{}] : {}", user.getId(), e.getMessage());
                errors++;
            }
        }

        log.info("✅ Scheduler terminé — {} succès | {} erreurs", success, errors);
    }

    // ── Endpoint de déclenchement manuel (pour test) ──
    // Appeler via : POST /api/test/run-recommendation-scheduler
    public void runManually() {
        recalculerToutesLesRecommandations();
    }
}