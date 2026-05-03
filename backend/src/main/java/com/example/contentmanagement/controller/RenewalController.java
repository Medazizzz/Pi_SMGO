package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.RenewalStatusDTO;
import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.RenewalAuditLog;
import com.example.contentmanagement.entity.SubscriptionStatus;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.RenewalAuditLogRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.DunningManager;
import com.example.contentmanagement.service.RenewalScoreEngine;
import com.example.contentmanagement.service.RenewalStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/renewal")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RenewalController {

    private final AbonnementRepository      abonnementRepository;
    private final RenewalAuditLogRepository auditLogRepository;
    private final RenewalScoreEngine        scoreEngine;
    private final RenewalStateMachine       stateMachine;
    private final UserRepository            userRepository;
    private final DunningManager dunningManager;  // ← ajoutez cette ligne


    @GetMapping("/status/me")
    public ResponseEntity<List<RenewalStatusDTO>> getMyRenewalStatus(
            @AuthenticationPrincipal String username) {

        log.info("[RenewalController] /status/me → username={}", username);

        String userId = resolveUserId(username);
        if (userId == null) {
            log.warn("[RenewalController] User introuvable pour username={}", username);
            return ResponseEntity.notFound().build();
        }

        List<RenewalStatusDTO> result = abonnementRepository
                .findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/audit/me")
    public ResponseEntity<List<RenewalAuditLog>> getMyAuditLog(
            @AuthenticationPrincipal String username) {

        log.info("[RenewalController] /audit/me → username={}", username);

        String userId = resolveUserId(username);
        if (userId == null) return ResponseEntity.notFound().build();

        List<RenewalAuditLog> logs = auditLogRepository
                .findByUserIdOrderByTimestampDesc(userId);

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<List<RenewalStatusDTO>> getRenewalStatus(
            @PathVariable String userId) {

        List<RenewalStatusDTO> result = abonnementRepository
                .findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{userId}/{abonnementId}")
    public ResponseEntity<RenewalStatusDTO> getOneRenewalStatus(
            @PathVariable String userId,
            @PathVariable String abonnementId) {

        return abonnementRepository.findById(abonnementId)
                .filter(a -> a.getUserId().equals(userId))
                .map(a -> ResponseEntity.ok(toDTO(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/compute-score/{abonnementId}")
    public ResponseEntity<RenewalStatusDTO> computeScore(
            @PathVariable String abonnementId) {

        return abonnementRepository.findById(abonnementId)
                .map(abonnement -> {
                    Abonnement scored = scoreEngine.computeScore(abonnement);
                    abonnementRepository.save(scored);
                    log.info("[RenewalController] Score recalculé pour abonnementId={}", abonnementId);
                    return ResponseEntity.ok(toDTO(scored));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/audit/{userId}")
    public ResponseEntity<List<RenewalAuditLog>> getAuditLog(
            @PathVariable String userId) {

        List<RenewalAuditLog> logs = auditLogRepository
                .findByUserIdOrderByTimestampDesc(userId);

        return ResponseEntity.ok(logs);
    }

    @PostMapping("/test-dunning/{abonnementId}")
    public ResponseEntity<String> testDunning(@PathVariable String abonnementId) {
        return abonnementRepository.findById(abonnementId)
                .map(a -> {
                    dunningManager.processDunning(a);
                    return ResponseEntity.ok("Dunning déclenché ✅");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/cancel/{abonnementId}")
    public ResponseEntity<Map<String, String>> cancelSubscription(
            @PathVariable String abonnementId,
            @AuthenticationPrincipal String username) {

        String userId = resolveUserId(username);
        if (userId == null) return ResponseEntity.notFound().build();

        return abonnementRepository.findById(abonnementId)
                .filter(a -> a.getUserId().equals(userId))
                .map(abonnement -> {
                    stateMachine.transition(
                            abonnement,
                            SubscriptionStatus.CANCELLED,
                            "USER_CANCELLED",
                            "Annulation manuelle par le user"
                    );
                    log.info("[RenewalController] Abonnement annulé id={} userId={}",
                            abonnementId, userId);
                    return ResponseEntity.ok(
                            Map.of("message", "Abonnement annulé avec succès")
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ================================================================
    // HELPER
    // ================================================================
    private String resolveUserId(String username) {
        if (username == null) return null;
        return userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElse(null);
    }

    // ================================================================
    // MAPPER — correction daysUntilExpiration null-safe
    // ================================================================
    private RenewalStatusDTO toDTO(Abonnement a) {
        return RenewalStatusDTO.builder()
                .abonnementId(a.getId())
                .userId(a.getUserId())
                .planType(a.getType() != null ? a.getType().name() : "UNKNOWN")
                .prix(a.getPrix())
                .status(a.getStatus() != null ? a.getStatus().name() : "ACTIVE")
                .renewalScore(a.getRenewalScore())
                .renewalDecision(a.getRenewalDecision())
                .renewalDecisionLabel(toDecisionLabel(a.getRenewalDecision()))
                .endDate(a.getEndDate())
                .nextRenewalDate(a.getNextRenewalDate())
                .lastRenewalDate(a.getLastRenewalDate())
                .retryCount(a.getRetryCount())
                .retryNextDate(a.getRetryNextDate())
                .dunningJ30Sent(a.isDunningJ30Sent())
                .dunningJ15Sent(a.isDunningJ15Sent())
                .dunningJ7Sent(a.isDunningJ7Sent())
                .dunningJ1Sent(a.isDunningJ1Sent())
                // ✅ null-safe : affiche null si pas de endDate
                .daysUntilExpiration(a.getEndDate() != null ? a.getDaysUntilExpiration() : null)
                .hasServiceAccess(a.hasServiceAccess())
                .build();
    }

    private String toDecisionLabel(String decision) {
        if (decision == null) return "En attente d'analyse";
        return switch (decision) {
            case "RENEW_AUTO"   -> "✅ Renouvellement automatique";
            case "RENEW_OFFER"  -> "🎁 Offre de rétention proposée";
            case "SUSPEND_RISK" -> "⚠️ Risque de suspension";
            case "CANCEL_RISK"  -> "🔴 Risque d'annulation";
            default             -> decision;
        };
    }
}