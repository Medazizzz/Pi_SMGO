package com.example.contentmanagement.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlRequest {

    @JsonProperty("total_spent")
    private double totalSpent;

    @JsonProperty("nb_subscriptions")
    private int nbSubscriptions;

    @JsonProperty("fidelity_score")
    private double fidelityScore;

    @JsonProperty("seniority_days")
    private double senioritDays;

    @JsonProperty("nb_reservations")
    private int nbReservations;

    @JsonProperty("nb_promos_used")
    private int nbPromosUsed;

    @JsonProperty("recently_active")
    private int recentlyActive;

    @JsonProperty("dominant_type_enc")
    private int dominantTypeEnc;

    @JsonProperty("fidelity_level_enc")
    private int fidelityLevelEnc;

    @JsonProperty("churn_risk")
    private double churnRisk;

    @JsonProperty("upgrade_trend")
    private double upgradeTrend;
}