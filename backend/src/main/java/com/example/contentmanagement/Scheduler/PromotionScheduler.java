package com.example.contentmanagement.Scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.example.contentmanagement.entity.Promotion;
import com.example.contentmanagement.repository.PromotionRepository;

import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PromotionScheduler {

    private final PromotionRepository promotionRepository;

    // ✅ S'exécute toutes les heures
    @Scheduled(fixedRate = 10000)
    public void deactivateExpiredPromotions() {
        Date now = new Date();

        // Récupère toutes les promotions actives
        List<Promotion> activePromotions = promotionRepository.findByActiveTrue();

        // Filtre celles qui sont expirées
        List<Promotion> expiredPromotions = activePromotions.stream()
                .filter(p -> p.getDateExpiration() != null && p.getDateExpiration().before(now))
                .toList();

        // Désactive et sauvegarde
        expiredPromotions.forEach(p -> {
            p.setActive(false);
            promotionRepository.save(p);
            log.info("Promotion désactivée automatiquement : {}", p.getCode());
        });

        log.info("Scheduler exécuté : {} promotion(s) désactivée(s)", expiredPromotions.size());
    }
}