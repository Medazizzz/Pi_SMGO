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
    private final EngagementService engagementService;

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

    @Override
    public EngagementService.EngagementResult getEngagementScore(String userId) {
        return engagementService.calculateEngagement(userId);
    }

    @Override
    public PromotionResponseDTO generatePersonalizedPromotion(String userId) {
        // ✅ Étape 1 — Calculer le score d'engagement
        EngagementService.EngagementResult result = engagementService.calculateEngagement(userId);
        EngagementService.EngagementLevel level = result.level();

        // ✅ Étape 2 — Désactiver TOUTES les anciennes promos de cet utilisateur
        List<Promotion> existing = promotionRepository.findByClientId(userId);
        for (Promotion p : existing) {
            p.setActive(false);
            promotionRepository.save(p);
        }

        // ✅ Étape 3 — Créer un code unique avec timestamp
        String uniqueSuffix = userId.substring(Math.max(0, userId.length() - 8)).toUpperCase();
        String timestamp = String.valueOf(System.currentTimeMillis() % 100000);
        String promoCode = level.name() + "" + uniqueSuffix + "" + timestamp;

        // ✅ Étape 4 — Créer la nouvelle promo
        Promotion promo = new Promotion();
        promo.setCode(promoCode);
        promo.setPourcentageReduction(level.discountPercent);
        promo.setClientId(userId);
        promo.setActive(true);

        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, 30);
        promo.setDateExpiration(cal.getTime());

        Promotion saved = promotionRepository.save(promo);

        log.info("✅ Promo régénérée — User: {} | Level: {} | Code: {} | Discount: {}%",
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