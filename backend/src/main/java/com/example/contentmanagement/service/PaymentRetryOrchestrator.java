package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.SubscriptionStatus;
import com.example.contentmanagement.repository.AbonnementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentRetryOrchestrator {

    private final AbonnementRepository abonnementRepository;
    private final RenewalStateMachine stateMachine;

    private static final int MAX_RETRIES     = 3;
    private static final int[] RETRY_DAYS    = {1, 3, 7};
    private static final int GRACE_PERIOD_DAYS = 7;
    private static final int SUSPENSION_DAYS   = 14;

    // ================================================================
    // POINT D'ENTRÉE PRINCIPAL
    // ================================================================

    public void processAllRetries() {
        List<Abonnement> toRetry = abonnementRepository
                .findByStatusAndRetryNextDateBefore(
                        SubscriptionStatus.FAILED_PAYMENT,
                        LocalDateTime.now()
                );

        log.info("[RetryOrchestrator] {} abonnements à retenter", toRetry.size());

        for (Abonnement abonnement : toRetry) {
            processRetry(abonnement);
        }
    }

    public void processExpiredGracePeriods() {
        List<Abonnement> expired = abonnementRepository
                .findByStatusAndEndDateBefore(
                        SubscriptionStatus.GRACE_PERIOD,
                        LocalDateTime.now()
                );

        log.info("[RetryOrchestrator] {} grace periods expirées", expired.size());

        for (Abonnement abonnement : expired) {
            log.warn("[RetryOrchestrator] Grace period expirée → SUSPENDED | userId={}",
                    abonnement.getUserId());

            stateMachine.transition(
                    abonnement,
                    SubscriptionStatus.SUSPENDED,
                    "GRACE_PERIOD_EXPIRED",
                    "Grace period de " + GRACE_PERIOD_DAYS + " jours écoulée sans paiement"
            );
        }
    }

    public void processExpiredSuspensions() {
        List<Abonnement> suspended = abonnementRepository
                .findByStatusAndEndDateBefore(
                        SubscriptionStatus.SUSPENDED,
                        LocalDateTime.now().minusDays(SUSPENSION_DAYS)
                );

        log.info("[RetryOrchestrator] {} suspensions expirées", suspended.size());

        for (Abonnement abonnement : suspended) {
            log.warn("[RetryOrchestrator] Suspension expirée → CANCELLED | userId={}",
                    abonnement.getUserId());

            stateMachine.transition(
                    abonnement,
                    SubscriptionStatus.CANCELLED,
                    "SUSPENSION_EXPIRED",
                    "Suspension de " + SUSPENSION_DAYS + " jours sans régularisation"
            );
        }
    }

    // ================================================================
    // LOGIQUE DE RETRY
    // ================================================================

    private void processRetry(Abonnement abonnement) {
        int retryCount = abonnement.getRetryCount();

        log.info("[RetryOrchestrator] Retry #{} pour userId={} | abonnementId={}",
                retryCount, abonnement.getUserId(), abonnement.getId());

        boolean paymentSuccess = attemptPayment(abonnement);

        if (paymentSuccess) {
            handlePaymentSuccess(abonnement);
        } else {
            handlePaymentFailure(abonnement, retryCount);
        }
    }

    // ================================================================
    // SIMULATION PAIEMENT
    // ================================================================

    private boolean attemptPayment(Abonnement abonnement) {
        double score = abonnement.getRenewalScore();
        boolean success = score > 60.0;

        log.info("[RetryOrchestrator] Tentative paiement | userId={} | score={} | résultat={}",
                abonnement.getUserId(), score, success ? "SUCCÈS" : "ÉCHEC");

        return success;
    }

    // ================================================================
    // SUCCÈS
    // ================================================================

    private void handlePaymentSuccess(Abonnement abonnement) {
        log.info("[RetryOrchestrator] Paiement réussi → RENEWED | userId={}",
                abonnement.getUserId());

        if (abonnement.getStatus() == SubscriptionStatus.FAILED_PAYMENT
                || abonnement.getStatus() == SubscriptionStatus.GRACE_PERIOD) {
            stateMachine.transition(
                    abonnement,
                    SubscriptionStatus.RENEWING,
                    "RETRY_PAYMENT_INITIATED",
                    "Retry paiement initié avec succès"
            );
        }

        stateMachine.transition(
                abonnement,
                SubscriptionStatus.RENEWED,
                "PAYMENT_SUCCESS",
                "Paiement accepté après " + abonnement.getRetryCount() + " tentative(s)"
        );

        stateMachine.transition(
                abonnement,
                SubscriptionStatus.ACTIVE,
                "SUBSCRIPTION_RENEWED",
                "Abonnement renouvelé et actif"
        );
    }

    // ================================================================
    // ÉCHEC
    // ================================================================

    private void handlePaymentFailure(Abonnement abonnement, int retryCount) {
        if (retryCount < MAX_RETRIES) {
            int nextRetryDays = RETRY_DAYS[Math.min(retryCount, RETRY_DAYS.length - 1)];
            LocalDateTime nextRetry = LocalDateTime.now().plusDays(nextRetryDays);

            abonnement.setRetryCount(retryCount + 1);
            abonnement.setRetryNextDate(nextRetry);
            abonnementRepository.save(abonnement);

            log.warn("[RetryOrchestrator] Paiement échoué | retry #{} dans {} jours | userId={}",
                    retryCount + 1, nextRetryDays, abonnement.getUserId());
        } else {
            log.warn("[RetryOrchestrator] MAX retries atteint → GRACE_PERIOD | userId={}",
                    abonnement.getUserId());

            abonnement.setEndDate(LocalDateTime.now().plusDays(GRACE_PERIOD_DAYS));
            abonnementRepository.save(abonnement);

            stateMachine.transition(
                    abonnement,
                    SubscriptionStatus.GRACE_PERIOD,
                    "MAX_RETRIES_REACHED",
                    "3 tentatives échouées → grace period de " + GRACE_PERIOD_DAYS + " jours"
            );
        }
    }
}