package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.PromotionRequestDTO;
import com.example.contentmanagement.dto.PromotionResponseDTO;

import java.util.List;

public interface PromotionService {
    PromotionResponseDTO createPromotion(PromotionRequestDTO dto);
    List<PromotionResponseDTO> getAllPromotions();
    List<PromotionResponseDTO> getActivePromotions();
    PromotionResponseDTO getPromotionById(String id);
    PromotionResponseDTO updatePromotion(String id, PromotionRequestDTO dto);
    void deletePromotion(String id);
    void deactivatePromotion(String id);
    List<PromotionResponseDTO> getPromotionsByClient(String clientId);
    PromotionResponseDTO getPromotionByCode(String code);
}
