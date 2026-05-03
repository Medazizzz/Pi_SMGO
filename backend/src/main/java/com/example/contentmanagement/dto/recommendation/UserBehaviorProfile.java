package com.example.contentmanagement.dto.recommendation;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBehaviorProfile {

    private String userId;

    // ── Depuis module Abonnements ──────────────────────
    private double totalDepense;          // somme de tous les prix
    private int    nbAbonnements;         // nombre total d'abonnements
    private String typeDominant;          // type le plus utilisé
    private double frequenceAbonnement;   // abonnements par mois
    private double tendanceGamme;         // 0.0 = descend, 1.0 = monte

    // ── Depuis module Réservations ─────────────────────
    private int    nbReservations;        // nombre total de réservations
    private boolean reservationRecente;   // réservation dans les 30 derniers jours

    // ── Depuis module Promotions ───────────────────────
    private int    nbPromosUtilisees;     // nombre de promos utilisées

    // ── Depuis module User ─────────────────────────────
    private long   ancienneteJours;       // jours depuis inscription
    private boolean actifRecemment;       // login dans les 30 derniers jours
    private double churnRisk;             // risque de départ 0.0 → 1.0

    // ── Depuis module Fidélité ─────────────────────────
    private double fidelityScore;         // score existant
    private String fidelityLevel;         // BRONZE / SILVER / GOLD
}