package com.example.contentmanagement.service.recommendation;

import com.example.contentmanagement.dto.recommendation.ScoringResult;
import com.example.contentmanagement.dto.recommendation.UserBehaviorProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class MultiCriteriaScoring {

    // ── Profils idéaux normalisés ──────────────────────
    // Vecteur : [depense, frequence, reservations, tendance, fidelite, anciennete]
    private static final double[] PROFIL_BASIC   = {0.10, 0.20, 0.10, 0.30, 0.10, 0.20};
    private static final double[] PROFIL_PREMIUM = {0.45, 0.50, 0.50, 0.55, 0.45, 0.50};
    private static final double[] PROFIL_ELITE   = {0.85, 0.85, 0.85, 0.85, 0.85, 0.80};

    // ── Poids de chaque critère ────────────────────────
    // Total = 1.0
    private static final double[] POIDS = {0.25, 0.20, 0.15, 0.15, 0.15, 0.10};

    public ScoringResult score(UserBehaviorProfile profile) {

        // ── Étape 1 : construire le vecteur normalisé du user ──
        double[] userVector = {
                normaliser(profile.getTotalDepense(),        0, 3000),
                normaliser(profile.getFrequenceAbonnement(), 0, 5),
                normaliser(profile.getNbReservations(),      0, 30),
                profile.getTendanceGamme(),                           // déjà 0→1
                normaliser(profile.getFidelityScore(),       0, 2000),
                normaliser(profile.getAncienneteJours(),     0, 365)
        };

        log.info("🔢 Vecteur user normalisé : depense={} | freq={} | res={} | tendance={} | fidelite={} | anciennete={}",
                round(userVector[0]), round(userVector[1]), round(userVector[2]),
                round(userVector[3]), round(userVector[4]), round(userVector[5]));

        // ── Étape 2 : distance euclidienne pondérée ───────────
        double distBasic   = distanceEuclidienne(userVector, PROFIL_BASIC);
        double distPremium = distanceEuclidienne(userVector, PROFIL_PREMIUM);
        double distElite   = distanceEuclidienne(userVector, PROFIL_ELITE);

        log.info("📐 Distances — BASIC:{} | PREMIUM:{} | ELITE:{}",
                round(distBasic), round(distPremium), round(distElite));

        // ── Étape 3 : conversion distance → similarité ────────
        // Plus la distance est petite = meilleur match
        double simBasic   = 1.0 / (1.0 + distBasic);
        double simPremium = 1.0 / (1.0 + distPremium);
        double simElite   = 1.0 / (1.0 + distElite);

        double totalSim = simBasic + simPremium + simElite;

        // ── Étape 4 : normalisation en pourcentage ─────────────
        int pctBasic   = (int) Math.round((simBasic   / totalSim) * 100);
        int pctPremium = (int) Math.round((simPremium / totalSim) * 100);
        int pctElite   = (int) Math.round((simElite   / totalSim) * 100);

        // ── Étape 5 : décision finale avec churnRisk ──────────
        String recommande = decider(pctBasic, pctPremium, pctElite, profile.getChurnRisk());

        // ── Étape 6 : score normalisé global ──────────────────
        double scoreNorm = normaliser(profile.getTotalDepense()   * 0.25 +
                        profile.getFidelityScore()  * 0.25 +
                        profile.getFrequenceAbonnement() * 200 * 0.20 +
                        profile.getNbReservations() * 50  * 0.15 +
                        profile.getAncienneteJours()* 5   * 0.15,
                0, 3000);

        // ── Étape 7 : générer les raisons ─────────────────────
        List<String> raisons = genererRaisons(profile, recommande);

        log.info("✅ Scoring — BASIC:{}% | PREMIUM:{}% | ELITE:{}% → {}",
                pctBasic, pctPremium, pctElite, recommande);

        return ScoringResult.builder()
                .matchBasic(pctBasic)
                .matchPremium(pctPremium)
                .matchElite(pctElite)
                .recommande(recommande)
                .scoreNormalise(Math.min(scoreNorm, 1.0))
                .raisons(raisons)
                .build();
    }

    // ── Distance euclidienne pondérée ──────────────────
    private double distanceEuclidienne(double[] user, double[] profil) {
        double sum = 0;
        for (int i = 0; i < user.length; i++) {
            sum += POIDS[i] * Math.pow(user[i] - profil[i], 2);
        }
        return Math.sqrt(sum);
    }

    // ── Normalisation Min-Max ──────────────────────────
    private double normaliser(double valeur, double min, double max) {
        if (max == min) return 0;
        return Math.max(0, Math.min(1, (valeur - min) / (max - min)));
    }

    // ── Décision finale avec prise en compte du churn ─
    private String decider(int pctBasic, int pctPremium, int pctElite, double churnRisk) {
        // Si risque de départ très élevé → proposer BASIC pour retenir
        if (churnRisk >= 0.75) return "BASIC";

        if (pctElite >= pctPremium && pctElite >= pctBasic)     return "ELITE";
        if (pctPremium >= pctBasic)                              return "PREMIUM";
        return "BASIC";
    }

    // ── Génération des raisons ─────────────────────────
    private List<String> genererRaisons(UserBehaviorProfile p, String recommande) {
        List<String> raisons = new ArrayList<>();

        if (p.getTotalDepense() < 100)
            raisons.add("Dépense totale faible (" + p.getTotalDepense() + " TND)");
        else if (p.getTotalDepense() >= 1000)
            raisons.add("Dépense élevée — profil premium (" + p.getTotalDepense() + " TND)");

        if (p.getChurnRisk() >= 0.5)
            raisons.add("Risque de départ détecté (" + (int)(p.getChurnRisk()*100) + "%)");

        if (p.getFidelityLevel() != null && !p.getFidelityLevel().equals("BRONZE"))
            raisons.add("Niveau fidélité : " + p.getFidelityLevel());

        if (p.isActifRecemment())
            raisons.add("Utilisateur actif récemment");

        if (p.getTendanceGamme() > 0.6)
            raisons.add("Tendance à monter en gamme détectée");

        if (p.getNbReservations() == 0)
            raisons.add("Aucune réservation — engagement faible");

        if ("ELITE".equals(recommande))
            raisons.add("Profil correspond au niveau Elite");
        else if ("PREMIUM".equals(recommande))
            raisons.add("Profil correspond au niveau Premium");

        return raisons;
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}