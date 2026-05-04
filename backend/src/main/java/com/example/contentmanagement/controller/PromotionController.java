package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.PromotionRequestDTO;
import com.example.contentmanagement.dto.PromotionResponseDTO;
import com.example.contentmanagement.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.EngagementService;
import java.util.Map;
import com.example.contentmanagement.service.FraudDetectionService;
import com.example.contentmanagement.entity.Promotion;
import java.util.ArrayList;
import com.example.contentmanagement.repository.PromotionRepository;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;
    private final UserRepository userRepository;
    private final FraudDetectionService fraudDetectionService;
    private final PromotionRepository promotionRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponseDTO> create(@Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.status(201).body(promotionService.createPromotion(dto));
    }

    @GetMapping
    public ResponseEntity<List<PromotionResponseDTO>> getActive() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromotionResponseDTO>> getAll() {
        return ResponseEntity.ok(promotionService.getAllPromotions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(promotionService.getPromotionById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<PromotionResponseDTO> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(promotionService.getPromotionByCode(code));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponseDTO> update(@PathVariable String id, @Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.ok(promotionService.updatePromotion(id, dto));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        promotionService.deactivatePromotion(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<PromotionResponseDTO>> getByClient(@PathVariable String clientId) {
        return ResponseEntity.ok(promotionService.getPromotionsByClient(clientId));
    }
    // ✅ Génère une promo personnalisée basée sur l'engagement
    @PostMapping("/personalized")
    public ResponseEntity<PromotionResponseDTO> generatePersonalized() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();

        User user = userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(promotionService.generatePersonalizedPromotion(user.getId()));
    }

    // ✅ Score d'engagement de l'utilisateur connecté
    @GetMapping("/engagement")
    public ResponseEntity<EngagementService.EngagementResult> getEngagement() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();

        User user = userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(promotionService.getEngagementScore(user.getId()));
    }
    // ✅ Vérification fraude via ML
    @PostMapping("/{id}/check-fraud")
    public ResponseEntity<Map<String, Object>> checkFraud(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = auth.getName();

        User user = userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(fraudDetectionService.checkFraud(id, user.getId()));
    }
    // ✅ Analyser toutes les promos actives
    @PostMapping("/analyze-all-fraud")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> analyzeAllFraud() {
        List<Promotion> activePromos = promotionRepository.findByActiveTrue();
        List<Map<String, Object>> results = new ArrayList<>();

        for (Promotion promo : activePromos) {
            if (promo.getClientId() != null && !promo.getClientId().isEmpty()) {
                Map<String, Object> result = fraudDetectionService.checkFraud(
                        promo.getId(), promo.getClientId()
                );
                result.put("promoCode", promo.getCode());
                result.put("promoId", promo.getId());
                results.add(result);
            }
        }
        return ResponseEntity.ok(results);
    }

    // ✅ Analyser une promo spécifique par ID
    @PostMapping("/{id}/analyze-fraud")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> analyzeOneFraud(@PathVariable String id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promo not found"));

        String clientId = promo.getClientId() != null ? promo.getClientId() : "unknown";
        Map<String, Object> result = fraudDetectionService.checkFraud(id, clientId);
        result.put("promoCode", promo.getCode());
        result.put("promoId", id);
        return ResponseEntity.ok(result);
    }
}
