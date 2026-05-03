package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.SubscriptionStatus;
import com.example.contentmanagement.repository.AbonnementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RenewalScoreEngine {

    private final AbonnementRepository abonnementRepository;

    // ================================================================
    // POIDS DE CHAQUE FACTEUR (total = 100)
    // ================================================================
    private static final double WEIGHT_PAYMENT_HISTORY = 0.30;
    private static final double WEIGHT_ENGAGEMENT      = 0.25;
    private static final double WEIGHT_LOYALTY         = 0.20;
    private static final double WEIGHT_CHURN_RISK      = 0.15; // négatif
    private static final double WEIGHT_TENURE          = 0.10;

    // ================================================================
    // SEUILS DE DÉCISION
    // ================================================================
    private static final double THRESHOLD_AUTO    = 80.0;
    private static final double THRESHOLD_OFFER   = 50.0;
    private static final double THRESHOLD_SUSPEND = 20.0;

    /**
     * Point d'entrée principal.
     * Calcule le score de renouvellement pour un abonnement
     * et met à jour renewalScore + renewalDecision.
     */
    public Abonnement computeScore(Abonnement abonnement) {

        String userId = abonnement.getUserId();

        // --- Calcul de chaque composante (0.0 à 1.0) ---
        double paymentHistory  = computePaymentHistory(userId);
        double engagement      = computeEngagement(abonnement);
        double loyalty         = computeLoyalty(abonnement);
        double churnRisk       = computeChurnRisk(abonnement);
        double tenure          = computeTenure(abonnement);

        // --- Formule pondérée ---
        double score = (paymentHistory * WEIGHT_PAYMENT_HISTORY * 100)
                + (engagement     * WEIGHT_ENGAGEMENT      * 100)
                + (loyalty        * WEIGHT_LOYALTY         * 100)
                - (churnRisk      * WEIGHT_CHURN_RISK      * 100)
                + (tenure         * WEIGHT_TENURE          * 100);

        // Clamp entre 0 et 100
        score = Math.max(0.0, Math.min(100.0, score));

        // --- Décision selon le score ---
        String decision = computeDecision(score);

        // --- Mise à jour de l'entité ---
        abonnement.setRenewalScore(Math.round(score * 100.0) / 100.0);
        abonnement.setRenewalDecision(decision);
        abonnement.setUpdatedAt(LocalDateTime.now());

        log.info("[RenewalScore] userId={} | score={} | decision={} | " +
                        "payment={} engagement={} loyalty={} churn={} tenure={}",
                userId, score, decision,
                paymentHistory, engagement, loyalty, churnRisk, tenure);

        return abonnement;
    }

    // ================================================================
    // FACTEUR 1 — Historique de paiement (30%)
    // Ratio : paiements réussis / total tentatives
    // ================================================================
    private double computePaymentHistory(String userId) {
        List<Abonnement> all = abonnementRepository.findByUserId(userId);
        if (all.isEmpty()) return 0.5; // inconnu → neutre

        long totalPaid = all.stream()
                .filter(a -> a.getStatus() == SubscriptionStatus.RENEWED
                        || a.getStatus() == SubscriptionStatus.ACTIVE)
                .count();

        long totalFailed = all.stream()
                .filter(a -> a.getStatus() == SubscriptionStatus.CANCELLED
                        || a.getStatus() == SubscriptionStatus.SUSPENDED)
                .count();

        long total = totalPaid + totalFailed;
        if (total == 0) return 0.8; // nouveau client → optimiste

        return (double) totalPaid / total;
    }

    // ================================================================
    // FACTEUR 2 — Engagement (25%)
    // Basé sur : activité récente + nb reservations dans l'abonnement
    // ================================================================
    private double computeEngagement(Abonnement abonnement) {
        double score = 0.0;

        // Abonnement actif récemment ?
        if (abonnement.getLastRenewalDate() != null) {
            long daysSinceRenewal = ChronoUnit.DAYS.between(
                    abonnement.getLastRenewalDate(), LocalDateTime.now()
            );
            // Plus c'est récent, meilleur c'est (max 180 jours)
            score += Math.max(0.0, 1.0 - (daysSinceRenewal / 180.0));
        } else {
            score += 0.5;
        }

        // Type de plan = signal d'engagement (ELITE > PREMIUM > BASIC)
        if (abonnement.getType() != null) {
            switch (abonnement.getType().name()) {
                case "ELITE"   -> score += 1.0;
                case "PREMIUM" -> score += 0.7;
                default        -> score += 0.3;
            }
        }

        // Normaliser sur 2 composantes → 0 à 1
        return Math.min(1.0, score / 2.0);
    }

    // ================================================================
    // FACTEUR 3 — Fidélité (20%)
    // Basé sur le fidelityScore existant dans le système
    // ================================================================
    private double computeLoyalty(Abonnement abonnement) {
        // On va chercher tous les abonnements du user pour calculer
        // la somme dépensée (même logique que FidelityScheduler)
        List<Abonnement> all = abonnementRepository.findByUserId(abonnement.getUserId());

        double totalSpent = all.stream()
                .mapToDouble(Abonnement::getPrix)
                .sum();

        // Seuils : BRONZE=0, SILVER=500, GOLD=1000, PLATINUM=2000
        if (totalSpent >= 2000) return 1.0;
        if (totalSpent >= 1000) return 0.75;
        if (totalSpent >= 500)  return 0.5;
        return 0.25;
    }

    // ================================================================
    // FACTEUR 4 — Risque de Churn (15%) — NÉGATIF dans la formule
    // Plus le client risque de partir, plus le score baisse
    // ================================================================
    private double computeChurnRisk(Abonnement abonnement) {
        // Si on a la décision ML existante, on s'en sert
        if (abonnement.getRenewalDecision() != null) {
            return switch (abonnement.getRenewalDecision()) {
                case "CANCEL_RISK"  -> 1.0;
                case "SUSPEND_RISK" -> 0.6;
                case "RENEW_OFFER"  -> 0.3;
                case "RENEW_AUTO"   -> 0.1;
                default             -> 0.4;
            };
        }

        // Sinon : heuristique basée sur le statut actuel
        return switch (abonnement.getStatus()) {
            case SUSPENDED, CANCELLED    -> 1.0;
            case FAILED_PAYMENT          -> 0.8;
            case GRACE_PERIOD            -> 0.6;
            case PRE_RENEWAL             -> 0.3;
            default                      -> 0.2;
        };
    }

    // ================================================================
    // FACTEUR 5 — Ancienneté (10%)
    // Plus le client est ancien, plus il est précieux
    // ================================================================
    private double computeTenure(Abonnement abonnement) {
        if (abonnement.getStartDate() == null) return 0.0;

        long days = ChronoUnit.DAYS.between(
                abonnement.getStartDate(), LocalDateTime.now()
        );

        // Normaliser : 0 jour = 0.0, 730 jours (2 ans) = 1.0
        return Math.min(1.0, days / 730.0);
    }

    // ================================================================
    // DÉCISION FINALE
    // ================================================================
    private String computeDecision(double score) {
        if (score >= THRESHOLD_AUTO)    return "RENEW_AUTO";
        if (score >= THRESHOLD_OFFER)   return "RENEW_OFFER";
        if (score >= THRESHOLD_SUSPEND) return "SUSPEND_RISK";
        return "CANCEL_RISK";
    }
}