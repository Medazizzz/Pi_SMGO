package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.PromotionRequestDTO;
import com.example.contentmanagement.dto.PromotionResponseDTO;
import com.example.contentmanagement.entity.Promotion;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.PromotionRepository;
import com.example.contentmanagement.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
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
        return promotionRepository.findByActiveTrue().stream().map(this::toResponse).toList();
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
