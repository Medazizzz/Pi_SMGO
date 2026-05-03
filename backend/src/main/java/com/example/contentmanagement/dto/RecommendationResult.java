package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResult {

    private String userId;
    private String recommande;        // "BASIC" | "PREMIUM" | "ELITE"

    // ── Pourcentages de match ──────────────────────────
    private int    matchBasic;        // ex: 58%
    private int    matchPremium;      // ex: 28%
    private int    matchElite;        // ex: 14%

    // ── Score global normalisé 0.0 → 1.0 ──────────────
    private double scoreNormalise;

    // ── Raisons de la décision ─────────────────────────
    private List<String> raisons;

    // ── Métriques détaillées ───────────────────────────
    private double  totalDepense;
    private double  frequence;
    private double  tendanceGamme;
    private double  churnRisk;
    private long    ancienneteJours;
    private boolean actifRecemment;
    private String  typeDominant;
    private int     nbReservations;
    private int     nbPromosUtilisees;

    private LocalDateTime calculatedAt;
}