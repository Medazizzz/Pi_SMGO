package com.example.contentmanagement.dto;
    
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FidelityDiscountDTO {

    // Infos user
    private String userId;
    private double currentFidelityScore;    // points disponibles

    // Infos abonnement
    private String abonnementId;
    private String planType;
    private double originalPrice;           // prix original

    // Simulation remise
    private int pointsToUse;               // points que le user veut utiliser
    private double discountAmount;          // remise en DT
    private double finalPrice;             // prix après remise
    private int remainingPoints;           // points restants après utilisation

    // Infos règles
    private int maxUsablePoints;           // max points utilisables pour cet abonnement
    private double maxDiscountAmount;      // montant max de remise
    private double conversionRate;         // 100 pts = 1 DT

    // Statut
    private boolean applied;               // remise appliquée ou juste simulée
    private String message;               // message lisible
}