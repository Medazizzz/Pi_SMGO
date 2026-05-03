package com.example.contentmanagement.service;


import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.RenewalAuditLog;
import com.example.contentmanagement.entity.SubscriptionStatus;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.RenewalAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class RenewalStateMachine {

    private final AbonnementRepository abonnementRepository;
    private final RenewalAuditLogRepository auditLogRepository;

    // ================================================================
    // TRANSITIONS AUTORISÉES
    // ================================================================
    // ACTIVE          → PRE_RENEWAL
    // PRE_RENEWAL     → RENEWING
    // RENEWING        → RENEWED
    // RENEWING        → FAILED_PAYMENT
    // FAILED_PAYMENT  → RENEWING      (retry)
    // FAILED_PAYMENT  → GRACE_PERIOD
    // GRACE_PERIOD    → RENEWED       (retry réussi)
    // GRACE_PERIOD    → SUSPENDED
    // SUSPENDED       → CANCELLED
    // SUSPENDED       → RENEWED       (paiement manuel)
    // ================================================================

    /**
     * Transition principale — valide et applique le changement d'état.
     */
    public Abonnement transition(Abonnement abonnement,
                                 SubscriptionStatus newStatus,
                                 String action,
                                 String details) {

        SubscriptionStatus currentStatus = abonnement.getStatus();

        // Vérifier si la transition est autorisée
        if (!isTransitionAllowed(currentStatus, newStatus)) {
            log.warn("[StateMachine] Transition REFUSÉE : {} → {} pour abonnementId={}",
                    currentStatus, newStatus, abonnement.getId());
            throw new IllegalStateException(
                    "Transition non autorisée : " + currentStatus + " → " + newStatus
            );
        }

        log.info("[StateMachine] Transition : {} → {} | abonnementId={} | action={}",
                currentStatus, newStatus, abonnement.getId(), action);

        // Appliquer la transition
        abonnement.setStatus(newStatus);
        abonnement.setUpdatedAt(LocalDateTime.now());

        // Actions spécifiques selon le nouvel état
        applyStateActions(abonnement, newStatus);

        // Sauvegarder l'abonnement
        abonnementRepository.save(abonnement);

        // Enregistrer dans l'audit log
        saveAuditLog(abonnement, currentStatus, newStatus, action, details);

        return abonnement;
    }

    // ================================================================
    // VÉRIFICATION DES TRANSITIONS AUTORISÉES
    // ================================================================
    private boolean isTransitionAllowed(SubscriptionStatus from,
                                        SubscriptionStatus to) {
        return switch (from) {
            case ACTIVE         -> to == SubscriptionStatus.PRE_RENEWAL
                    || to == SubscriptionStatus.CANCELLED;

            case PRE_RENEWAL    -> to == SubscriptionStatus.RENEWING
                    || to == SubscriptionStatus.CANCELLED;

            case RENEWING       -> to == SubscriptionStatus.RENEWED
                    || to == SubscriptionStatus.FAILED_PAYMENT;

            case RENEWED        -> to == SubscriptionStatus.ACTIVE
                    || to == SubscriptionStatus.PRE_RENEWAL;

            case FAILED_PAYMENT -> to == SubscriptionStatus.RENEWING
                    || to == SubscriptionStatus.GRACE_PERIOD;

            case GRACE_PERIOD   -> to == SubscriptionStatus.RENEWED
                    || to == SubscriptionStatus.SUSPENDED;

            case SUSPENDED      -> to == SubscriptionStatus.RENEWED
                    || to == SubscriptionStatus.CANCELLED;

            case CANCELLED      -> false; // état final, aucune transition
        };
    }

    // ================================================================
    // ACTIONS AUTOMATIQUES SELON LE NOUVEL ÉTAT
    // ================================================================
    private void applyStateActions(Abonnement abonnement,
                                   SubscriptionStatus newStatus) {
        switch (newStatus) {

            case PRE_RENEWAL -> {
                // Réinitialiser les flags dunning pour ce cycle
                abonnement.setDunningJ30Sent(false);
                abonnement.setDunningJ15Sent(false);
                abonnement.setDunningJ7Sent(false);
                abonnement.setDunningJ1Sent(false);
            }

            case RENEWING -> {
                // Rien de spécial — le PaymentRetryOrchestrator prend la main
            }

            case RENEWED -> {
                // Renouvellement réussi → remettre à ACTIVE + nouvelle date
                abonnement.setLastRenewalDate(LocalDateTime.now());
                abonnement.setRetryCount(0);
                abonnement.setRetryNextDate(null);

                // Prolonger d'un mois
                LocalDateTime newEndDate = abonnement.getEndDate() != null
                        ? abonnement.getEndDate().plusMonths(1)
                        : LocalDateTime.now().plusMonths(1);

                abonnement.setEndDate(newEndDate);
                abonnement.setNextRenewalDate(newEndDate);
            }

            case FAILED_PAYMENT -> {
                // Planifier le premier retry à J+1
                abonnement.setRetryCount(abonnement.getRetryCount() + 1);
                abonnement.setRetryNextDate(LocalDateTime.now().plusDays(1));
            }

            case GRACE_PERIOD -> {
                // Grace period = 7 jours supplémentaires d'accès
                log.warn("[StateMachine] GRACE PERIOD activée pour userId={}",
                        abonnement.getUserId());
            }

            case SUSPENDED -> {
                // Service coupé — on log un warning critique
                log.warn("[StateMachine] Abonnement SUSPENDU pour userId={}",
                        abonnement.getUserId());
            }

            case CANCELLED -> {
                // Fin définitive
                log.warn("[StateMachine] Abonnement ANNULÉ pour userId={}",
                        abonnement.getUserId());
                abonnement.setRetryCount(0);
                abonnement.setRetryNextDate(null);
            }

            default -> { /* ACTIVE : rien */ }
        }
    }

    // ================================================================
    // AUDIT LOG
    // ================================================================
    private void saveAuditLog(Abonnement abonnement,
                              SubscriptionStatus previousStatus,
                              SubscriptionStatus newStatus,
                              String action,
                              String details) {
        RenewalAuditLog log = RenewalAuditLog.builder()
                .userId(abonnement.getUserId())
                .abonnementId(abonnement.getId())
                .action(action)
                .previousStatus(previousStatus.name())
                .newStatus(newStatus.name())
                .renewalScore(abonnement.getRenewalScore())
                .decision(abonnement.getRenewalDecision())
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }
}