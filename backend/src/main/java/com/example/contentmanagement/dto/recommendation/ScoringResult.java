package com.example.contentmanagement.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringResult {

    // Pourcentages de match par abonnement
    private int matchBasic;           // ex: 65%
    private int matchPremium;         // ex: 25%
    private int matchElite;           // ex: 10%

    // Abonnement recommandé
    private String recommande;        // "BASIC" | "PREMIUM" | "ELITE"

    // Score normalisé final 0.0 → 1.0
    private double scoreNormalise;

    // Raisons de la décision
    private java.util.List<String> raisons;
}