package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.FidelityDiscountDTO;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.FidelityDiscountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/fidelity-discount")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FidelityDiscountController {

    private final FidelityDiscountService fidelityDiscountService;
    private final UserRepository          userRepository;

    // ================================================================
    // HELPER — Résoudre username → MongoDB _id
    // ================================================================
    private String resolveUserId(String usernameOrId) {
        // Si c'est déjà un MongoDB ObjectId (24 chars hex) → retourner tel quel
        if (usernameOrId != null && usernameOrId.matches("[a-fA-F0-9]{24}")) {
            return usernameOrId;
        }
        // Sinon chercher par username
        log.info("[FidelityDiscount] Résolution username → id : {}", usernameOrId);
        User user = userRepository.findByUsername(usernameOrId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User non trouvé avec username : " + usernameOrId));
        log.info("[FidelityDiscount] userId résolu : {}", user.getId());
        return user.getId();
    }

    // ================================================================
    // GET /api/fidelity-discount/info/{userId}/{abonnementId}
    // Voir les infos de remise disponibles
    // ================================================================
    @GetMapping("/info/{userId}/{abonnementId}")
    public ResponseEntity<FidelityDiscountDTO> getInfo(
            @PathVariable String userId,
            @PathVariable String abonnementId) {

        String resolvedId = resolveUserId(userId);
        return ResponseEntity.ok(
                fidelityDiscountService.getDiscountInfo(resolvedId, abonnementId)
        );
    }

    // ================================================================
    // POST /api/fidelity-discount/simulate
    // Simuler une remise sans l'appliquer
    // ================================================================
    @PostMapping("/simulate")
    public ResponseEntity<FidelityDiscountDTO> simulate(
            @RequestParam String userId,
            @RequestParam String abonnementId,
            @RequestParam int pointsToUse) {

        String resolvedId = resolveUserId(userId);
        return ResponseEntity.ok(
                fidelityDiscountService.simulate(resolvedId, abonnementId, pointsToUse)
        );
    }

    // ================================================================
    // POST /api/fidelity-discount/apply
    // Appliquer la remise (déduit les points du user)
    // ================================================================
    @PostMapping("/apply")
    public ResponseEntity<FidelityDiscountDTO> apply(
            @RequestParam String userId,
            @RequestParam String abonnementId,
            @RequestParam int pointsToUse) {

        String resolvedId = resolveUserId(userId);
        return ResponseEntity.ok(
                fidelityDiscountService.apply(resolvedId, abonnementId, pointsToUse)
        );
    }
}