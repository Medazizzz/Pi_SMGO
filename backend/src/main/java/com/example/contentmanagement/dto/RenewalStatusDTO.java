package com.example.contentmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenewalStatusDTO {

    // Infos abonnement
    private String abonnementId;
    private String userId;
    private String planType;
    private double prix;

    // État actuel
    private String status;
    private double renewalScore;
    private String renewalDecision;
    private String renewalDecisionLabel; // texte lisible pour Angular

    // Dates
    private LocalDateTime endDate;
    private LocalDateTime nextRenewalDate;
    private LocalDateTime lastRenewalDate;

    // Retry
    private int retryCount;
    private LocalDateTime retryNextDate;

    // Dunning
    private boolean dunningJ30Sent;
    private boolean dunningJ15Sent;
    private boolean dunningJ7Sent;
    private boolean dunningJ1Sent;

    // Jours restants (calculé)
    private Long daysUntilExpiration;

    // Accès au service
    private boolean hasServiceAccess;
}
