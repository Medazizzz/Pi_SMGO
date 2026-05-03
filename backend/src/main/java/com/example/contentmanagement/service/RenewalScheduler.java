package com.example.contentmanagement.service;


import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.SubscriptionStatus;
import com.example.contentmanagement.repository.AbonnementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RenewalScheduler {

    private final AbonnementRepository       abonnementRepository;
    private final RenewalScoreEngine         scoreEngine;
    private final RenewalStateMachine        stateMachine;
    private final DunningManager             dunningManager;
    private final PaymentRetryOrchestrator   retryOrchestrator;

    // ================================================================
    // SCHEDULER PRINCIPAL — tourne chaque nuit à 00:05
    // ================================================================
    @Scheduled(cron = "0 5 0 * * *")
    public void runNightlyRenewalPipeline() {
        log.info("========================================");
        log.info("[RenewalScheduler] Démarrage pipeline nocturne : {}",
                LocalDateTime.now());
        log.info("========================================");

        // ÉTAPE 1 — Calculer les scores de renouvellement
        step1_computeRenewalScores();

        // ÉTAPE 2 — Passer les abonnements en PRE_RENEWAL (J-30)
        step2_activatePreRenewal();

        // ÉTAPE 3 — Envoyer les emails dunning
        step3_processDunning();

        // ÉTAPE 4 — Déclencher les renouvellements automatiques (J=0)
        step4_triggerAutoRenewals();

        // ÉTAPE 5 — Retenter les paiements échoués
        step5_processRetries();

        // ÉTAPE 6 — Gérer les grace periods expirées
        step6_processExpiredGracePeriods();

        // ÉTAPE 7 — Annuler les suspensions expirées
        step7_processExpiredSuspensions();

        log.info("========================================");
        log.info("[RenewalScheduler] Pipeline terminé : {}",
                LocalDateTime.now());
        log.info("========================================");
    }

    // ================================================================
    // ÉTAPE 1 — Calculer les scores
    // ================================================================
    private void step1_computeRenewalScores() {
        log.info("[Step 1] Calcul des scores de renouvellement...");

        List<Abonnement> actifs = abonnementRepository
                .findByStatus(SubscriptionStatus.ACTIVE);
        actifs.addAll(abonnementRepository
                .findByStatus(SubscriptionStatus.PRE_RENEWAL));

        for (Abonnement abonnement : actifs) {
            Abonnement scored = scoreEngine.computeScore(abonnement);
            abonnementRepository.save(scored);
        }

        log.info("[Step 1] {} abonnements scorés", actifs.size());
    }

    // ================================================================
    // ÉTAPE 2 — Activer PRE_RENEWAL pour les abonnements dans J-30
    // ================================================================
    private void step2_activatePreRenewal() {
        log.info("[Step 2] Activation PRE_RENEWAL...");

        LocalDateTime now   = LocalDateTime.now();
        LocalDateTime in30d = now.plusDays(30);

        List<Abonnement> toPreRenew = abonnementRepository
                .findByStatusAndEndDateBetween(
                        SubscriptionStatus.ACTIVE, now, in30d
                );

        for (Abonnement abonnement : toPreRenew) {
            stateMachine.transition(
                    abonnement,
                    SubscriptionStatus.PRE_RENEWAL,
                    "ENTERING_RENEWAL_WINDOW",
                    "Abonnement dans la fenêtre J-30"
            );
        }

        log.info("[Step 2] {} abonnements passés en PRE_RENEWAL", toPreRenew.size());
    }

    // ================================================================
    // ÉTAPE 3 — Dunning emails
    // ================================================================
    private void step3_processDunning() {
        log.info("[Step 3] Envoi emails dunning...");

        List<Abonnement> preRenewal = abonnementRepository
                .findByStatus(SubscriptionStatus.PRE_RENEWAL);

        for (Abonnement abonnement : preRenewal) {
            dunningManager.processDunning(abonnement);
        }

        log.info("[Step 3] Dunning traité pour {} abonnements", preRenewal.size());
    }

    // ================================================================
    // ÉTAPE 4 — Renouvellement automatique (J=0)
    // ================================================================
    private void step4_triggerAutoRenewals() {
        log.info("[Step 4] Déclenchement renouvellements automatiques...");

        LocalDateTime now = LocalDateTime.now();

        List<Abonnement> expired = abonnementRepository
                .findByStatusAndEndDateBetween(
                        SubscriptionStatus.PRE_RENEWAL,
                        now.minusDays(1),
                        now
                );

        int renewed = 0;
        int offers  = 0;
        int risks   = 0;

        for (Abonnement abonnement : expired) {
            switch (abonnement.getRenewalDecision()) {

                case "RENEW_AUTO" -> {
                    // Score >= 80 → renouvellement silencieux
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.RENEWING,
                            "AUTO_RENEWAL_TRIGGERED",
                            "Score " + abonnement.getRenewalScore() + " → renouvellement auto"
                    );
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.RENEWED,
                            "AUTO_RENEWAL_SUCCESS",
                            "Renouvellement automatique réussi"
                    );
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.ACTIVE,
                            "SUBSCRIPTION_ACTIVE",
                            "Abonnement actif après renouvellement"
                    );
                    renewed++;
                }

                case "RENEW_OFFER" -> {
                    // Score 50-79 → renouveler mais avec une offre
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.RENEWING,
                            "OFFER_RENEWAL_TRIGGERED",
                            "Score " + abonnement.getRenewalScore() + " → offre de rétention envoyée"
                    );
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.RENEWED,
                            "OFFER_RENEWAL_SUCCESS",
                            "Renouvellement avec offre réussi"
                    );
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.ACTIVE,
                            "SUBSCRIPTION_ACTIVE",
                            "Abonnement actif après offre"
                    );
                    offers++;
                }

                case "SUSPEND_RISK", "CANCEL_RISK" -> {
                    // Score < 50 → ne pas renouveler, passer en FAILED_PAYMENT
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.RENEWING,
                            "HIGH_RISK_RENEWAL_ATTEMPT",
                            "Score " + abonnement.getRenewalScore() + " → tentative malgré risque"
                    );
                    stateMachine.transition(abonnement,
                            SubscriptionStatus.FAILED_PAYMENT,
                            "HIGH_RISK_PAYMENT_FAILED",
                            "Score trop bas → paiement non initié"
                    );
                    risks++;
                }
            }
        }

        log.info("[Step 4] Résultat → AUTO:{} | OFFRE:{} | RISQUE:{}",
                renewed, offers, risks);
    }

    // ================================================================
    // ÉTAPES 5, 6, 7 — Déléguer à PaymentRetryOrchestrator
    // ================================================================
    private void step5_processRetries() {
        log.info("[Step 5] Traitement des retries paiement...");
        retryOrchestrator.processAllRetries();
    }

    private void step6_processExpiredGracePeriods() {
        log.info("[Step 6] Traitement grace periods expirées...");
        retryOrchestrator.processExpiredGracePeriods();
    }

    private void step7_processExpiredSuspensions() {
        log.info("[Step 7] Traitement suspensions expirées...");
        retryOrchestrator.processExpiredSuspensions();
    }
}
