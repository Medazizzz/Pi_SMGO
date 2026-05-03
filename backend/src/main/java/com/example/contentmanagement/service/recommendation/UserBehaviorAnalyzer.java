package com.example.contentmanagement.service.recommendation;

import com.example.contentmanagement.dto.recommendation.UserBehaviorProfile;
import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.example.contentmanagement.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserBehaviorAnalyzer {

    private final AbonnementRepository abonnementRepo;
    private final ReservationRepository reservationRepo;
    private final PromotionRepository promotionRepo;

    public UserBehaviorProfile analyze(User user) {
        String userId = user.getId();

        // ── Collecte depuis chaque module ─────────────
        List<Abonnement> abonnements = abonnementRepo.findByUserId(userId);

        // ✅ Fix 1 — countByUserId retourne Long nullable
        int nbReservations = 0;
        try {
            Long countRes = reservationRepo.countByUserId(userId);
            nbReservations = countRes != null ? countRes.intValue() : 0;
        } catch (Exception e) {
            log.warn("⚠️ Module réservations non disponible pour [{}]", userId);
        }

        // ✅ Fix 2 — countUsedByUserId retourne Long nullable
        int nbPromos = 0;
        try {
            // ✅ REMPLACER par
            Long countPromo = promotionRepo.countByClientId(userId);
            nbPromos = countPromo != null ? countPromo.intValue() : 0;
        } catch (Exception e) {
            log.warn("⚠️ Module promotions non disponible pour [{}]", userId);
        }

        // ── Calcul de chaque métrique ──────────────────
        double  totalDepense      = calculerTotalDepense(abonnements);
        double  frequence         = calculerFrequence(abonnements, user.getCreatedAt());
        double  tendance          = calculerTendance(abonnements);
        String  typeDominant      = calculerTypeDominant(abonnements);
        long    anciennete        = calculerAnciennete(user.getCreatedAt());
        boolean actifRecemment    = estActifRecemment(user.getLastLoginAt());
        boolean reservationRecente = nbReservations > 0;
        double  churnRisk         = calculerChurnRisk(
                abonnements,
                nbReservations,
                anciennete,
                actifRecemment
        );

        UserBehaviorProfile profile = UserBehaviorProfile.builder()
                .userId(userId)
                .totalDepense(totalDepense)
                .nbAbonnements(abonnements.size())
                .typeDominant(typeDominant)
                .frequenceAbonnement(frequence)
                .tendanceGamme(tendance)
                .nbReservations(nbReservations)
                .reservationRecente(reservationRecente)
                .nbPromosUtilisees(nbPromos)
                .ancienneteJours(anciennete)
                .actifRecemment(actifRecemment)
                .churnRisk(churnRisk)
                .fidelityScore(user.getFidelityScore())
                .fidelityLevel(user.getFidelityLevel())
                .build();

        log.info("📊 Profil analysé pour [{}] → depense={} | churn={} | tendance={} | reservations={} | promos={}",
                userId, totalDepense, churnRisk, tendance, nbReservations, nbPromos);

        return profile;
    }

    // ── Méthodes de calcul ─────────────────────────────

    private double calculerTotalDepense(List<Abonnement> liste) {
        return liste.stream()
                .mapToDouble(Abonnement::getPrix)
                .sum();
    }

    private double calculerFrequence(List<Abonnement> liste, LocalDateTime inscription) {
        if (liste.isEmpty() || inscription == null) return 0;
        long mois = ChronoUnit.MONTHS.between(inscription, LocalDateTime.now());
        if (mois == 0) mois = 1;
        return (double) liste.size() / mois;
    }

    private double calculerTendance(List<Abonnement> liste) {
        if (liste.size() < 2) return 0.5;

        double[] valeurs = liste.stream()
                .sorted(Comparator.comparing(Abonnement::getId))
                .mapToDouble(a -> switch (a.getType()) {
                    case BASIC   -> 1.0;
                    case PREMIUM -> 2.0;
                    default      -> 1.5;
                })
                .toArray();

        double pente = calculerPente(valeurs);
        return Math.max(0, Math.min(1, 0.5 + pente * 0.5));
    }

    private double calculerPente(double[] y) {
        int n = y.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX  += i;
            sumY  += y[i];
            sumXY += i * y[i];
            sumX2 += (double) i * i;
        }
        double denom = n * sumX2 - sumX * sumX;
        return denom == 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    }

    private String calculerTypeDominant(List<Abonnement> liste) {
        if (liste.isEmpty()) return "AUCUN";
        return liste.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getType().toString(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("AUCUN");
    }

    private long calculerAnciennete(LocalDateTime inscription) {
        if (inscription == null) return 0;
        return ChronoUnit.DAYS.between(inscription, LocalDateTime.now());
    }

    private boolean estActifRecemment(LocalDateTime lastLogin) {
        if (lastLogin == null) return false;
        return ChronoUnit.DAYS.between(lastLogin, LocalDateTime.now()) <= 30;
    }

    private double calculerChurnRisk(List<Abonnement> abonnements,
                                     int nbReservations,
                                     long anciennete,
                                     boolean actifRecemment) {
        double risk = 0.0;

        if (!actifRecemment)                              risk += 0.35;
        if (nbReservations == 0)                          risk += 0.25;
        if (calculerTotalDepense(abonnements) < 100)      risk += 0.25;
        if (anciennete < 30 && abonnements.size() <= 1)   risk += 0.15;

        return Math.min(risk, 1.0);
    }
}