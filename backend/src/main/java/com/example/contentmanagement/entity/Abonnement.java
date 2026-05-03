package com.example.contentmanagement.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "abonnements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Abonnement {

    @Id
    private String id;

    @NotNull(message = "Subscription type is required")
    private AbonnementType type;

    @Positive(message = "Price must be positive")
    private double prix;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must contain between 10 and 500 characters")
    private String description;

    private String userId;

    // ================================================================
    // === DATES
    // ================================================================
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime nextRenewalDate;
    private LocalDateTime lastRenewalDate;

    // ================================================================
    // === RENEWAL SCORE & DECISION
    // ================================================================
    @Builder.Default
    private double renewalScore = 0.0;

    // RENEW_AUTO / RENEW_OFFER / SUSPEND_RISK / CANCEL_RISK
    @Builder.Default
    private String renewalDecision = "UNKNOWN";

    // ================================================================
    // === ÉTAT DE L'ABONNEMENT
    // ================================================================
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Builder.Default
    private int retryCount = 0;

    private LocalDateTime retryNextDate;

    // ================================================================
    // === DUNNING (emails envoyés ?)
    // ================================================================
    @Builder.Default
    private boolean dunningJ30Sent = false;

    @Builder.Default
    private boolean dunningJ15Sent = false;

    @Builder.Default
    private boolean dunningJ7Sent = false;

    @Builder.Default
    private boolean dunningJ1Sent = false;

    // ================================================================
    // === METADATA
    // ================================================================
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    // ================================================================
    // === MÉTHODES UTILITAIRES
    // ================================================================

    /**
     * Retourne le prix comme montant pour le calcul de fidélité.
     * Evite d'avoir un champ "amount" séparé jamais alimenté.
     */
    public double getAmount() {
        return this.prix;
    }

    /**
     * Nombre de jours restants avant expiration.
     */
    public long getDaysUntilExpiration() {
        if (this.endDate == null) return Long.MAX_VALUE;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), this.endDate);
    }

    /**
     * Vrai si l'abonnement est dans la fenêtre de pré-renouvellement (J-30).
     */
    public boolean isInRenewalWindow() {
        long days = getDaysUntilExpiration();
        return days >= 0 && days <= 30;
    }

    /**
     * Vrai si l'abonnement est expiré.
     */
    public boolean isExpired() {
        if (this.endDate == null) return false;
        return LocalDateTime.now().isAfter(this.endDate);
    }

    /**
     * Vrai si le statut permet encore l'accès au service.
     */
    public boolean hasServiceAccess() {
        return this.status == SubscriptionStatus.ACTIVE
                || this.status == SubscriptionStatus.PRE_RENEWAL
                || this.status == SubscriptionStatus.RENEWING
                || this.status == SubscriptionStatus.RENEWED
                || this.status == SubscriptionStatus.GRACE_PERIOD;
    }
}