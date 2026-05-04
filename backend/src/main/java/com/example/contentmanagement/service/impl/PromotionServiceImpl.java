package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.PromotionRequestDTO;
import com.example.contentmanagement.dto.PromotionResponseDTO;
import com.example.contentmanagement.entity.Promotion;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.PromotionRepository;
import com.example.contentmanagement.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.contentmanagement.service.EngagementService;
import java.util.Calendar;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;

    @Override
    public PromotionResponseDTO createPromotion(PromotionRequestDTO dto) {
        Promotion promotion = new Promotion();
        promotion.setCode(dto.getCode());
        promotion.setPourcentageReduction(dto.getPourcentageReduction());
        promotion.setDateExpiration(dto.getDateExpiration());
        promotion.setClientId(dto.getClientId());
        promotion.setActive(true);
        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    public List<PromotionResponseDTO> getAllPromotions() {
        return promotionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<PromotionResponseDTO> getActivePromotions() {
        return promotionRepository.findByActiveTrue()
                .stream()
                .filter(p -> p.getClientId() == null || p.getClientId().isEmpty())
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PromotionResponseDTO getPromotionById(String id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id: " + id));
        return toResponse(promotion);
    }

    @Override
    public PromotionResponseDTO updatePromotion(String id, PromotionRequestDTO dto) {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id: " + id));

        existing.setCode(dto.getCode());
        existing.setPourcentageReduction(dto.getPourcentageReduction());
        existing.setDateExpiration(dto.getDateExpiration());
        existing.setClientId(dto.getClientId());

        return toResponse(promotionRepository.save(existing));
    }

    @Override
    public void deletePromotion(String id) {
        promotionRepository.deleteById(id);
    }

    @Override
    public void deactivatePromotion(String id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id: " + id));
        promotion.setActive(false);
        promotionRepository.save(promotion);
    }

    @Override
    public List<PromotionResponseDTO> getPromotionsByClient(String clientId) {
        return promotionRepository.findByClientId(clientId).stream().map(this::toResponse).toList();
    }

    @Override
    public PromotionResponseDTO getPromotionByCode(String code) {
        Promotion promotion = promotionRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion code not found: " + code));
        return toResponse(promotion);
    }
    private final EngagementService engagementService;

    @Override
    public EngagementService.EngagementResult getEngagementScore(String userId) {
        return engagementService.calculateEngagement(userId);
    }

    @Override
    public PromotionResponseDTO generatePersonalizedPromotion(String userId) {
        // ✅ Étape 1 — Calculer le score d'engagement
        EngagementService.EngagementResult result = engagementService.calculateEngagement(userId);
        EngagementService.EngagementLevel level = result.level();

        // ✅ Étape 2 — Vérifier si une promo personnalisée existe déjà
        String promoCode = level.name() + "_" + userId.substring(0, 8).toUpperCase();

        List<Promotion> existing = promotionRepository.findByClientId(userId);
        for (Promotion p : existing) {
            if (p.getCode().startsWith(level.name() + "_")) {
                if (p.isActive()) {
                    // Promo du même niveau existe → retourner l'existante
                    return toResponse(p);
                }
            }
        }

        // ✅ Étape 3 — Désactiver les anciennes promos personnalisées
        for (Promotion p : existing) {
            if (p.getCode().contains("_" + userId.substring(0, 8).toUpperCase())) {
                p.setActive(false);
                promotionRepository.save(p);
            }
        }

        // ✅ Étape 4 — Créer la nouvelle promo personnalisée
        Promotion promo = new Promotion();
        promo.setCode(promoCode);
        promo.setPourcentageReduction(level.discountPercent);
        promo.setClientId(userId);
        promo.setActive(true);

        // Valable 30 jours
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, 30);
        promo.setDateExpiration(cal.getTime());

        Promotion saved = promotionRepository.save(promo);

        log.info("✅ Promo personnalisée générée — User: {} | Level: {} | Code: {} | Discount: {}%",
                result.username(), level.label, promoCode, level.discountPercent);

        return toResponse(saved);
    }

    private PromotionResponseDTO toResponse(Promotion promotion) {
        PromotionResponseDTO dto = new PromotionResponseDTO();
        dto.setId(promotion.getId());
        dto.setCode(promotion.getCode());
        dto.setPourcentageReduction(promotion.getPourcentageReduction());
        dto.setDateExpiration(promotion.getDateExpiration());
        dto.setClientId(promotion.getClientId());
        dto.setActive(promotion.isActive());
        return dto;
    }
}
