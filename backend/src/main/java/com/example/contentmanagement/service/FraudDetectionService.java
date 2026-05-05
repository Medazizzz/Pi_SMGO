package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Promotion;
import com.example.contentmanagement.repository.PromotionRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {

    private final PromotionRepository promotionRepository;
    private final EngagementService engagementService;
    private final RestTemplate restTemplate;
    private final ReservationRepository reservationRepository;

    private static final String ML_API_URL = "http://localhost:8000/predict";

    public Map<String, Object> checkFraud(String promoId, String userId) {
        Promotion promo = promotionRepository.findById(promoId)
                .orElseThrow(() -> new RuntimeException("Promo not found"));

        EngagementService.EngagementResult engagement =
                engagementService.calculateEngagement(userId);

        int levelMismatch = calculateLevelMismatch(promo.getCode(), engagement.totalScore());

        // ✅ Compte réel des promos générées par cet utilisateur
        long totalPromos = promotionRepository.findByClientId(userId).size();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("userId", userId);
        requestBody.put("promoLevel", extractLevel(promo.getCode()));
        // ✅ Compte réel des réservations de cet utilisateur
        long totalReservations = reservationRepository.countByUserId(userId);
        requestBody.put("usageCount", (double) totalReservations);
        requestBody.put("timeBetweenUsages", 600.0);
        requestBody.put("engagementScore", (double) engagement.totalScore());
        requestBody.put("levelMismatch", levelMismatch);
        // ✅ Utilise le nombre réel de promos → fraude si > 4
        requestBody.put("regenerationCount", (double) totalPromos);
        requestBody.put("hourOfDay", java.time.LocalTime.now().getHour());
        requestBody.put("accountAgeDays", 60.0);
        requestBody.put("totalReservations", 0);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    ML_API_URL, entity, Map.class);

            Map<String, Object> result = response.getBody();
            log.info("🤖 Fraud check — User: {} | Promos: {} | Alert: {}",
                    userId, totalPromos, result.get("alertLevel"));
            applyAction(promo, result);
            return result;

        } catch (Exception e) {
            log.error("❌ Erreur appel ML API: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("isFraud", false);
            fallback.put("anomalyScore", 0.0);
            fallback.put("alertLevel", "SAFE");
            fallback.put("action", "NONE");
            return fallback;
        }
    }

    private void applyAction(Promotion promo, Map<String, Object> result) {
        String action = (String) result.getOrDefault("action", "NONE");
        switch (action) {
            case "DEACTIVATE_PROMO":
            case "DEACTIVATE_AND_SUSPEND":
                promo.setActive(false);
                promotionRepository.save(promo);
                log.info("🚨 Promo {} désactivée automatiquement", promo.getCode());
                break;
            default:
                break;
        }
    }

    private int calculateLevelMismatch(String promoCode, int engagementScore) {
        String level = extractLevel(promoCode);
        return switch (level) {
            case "DIAMOND" -> engagementScore < 51 ? 1 : 0;
            case "GOLD"    -> engagementScore < 31 ? 1 : 0;
            case "SILVER"  -> engagementScore < 11 ? 1 : 0;
            default        -> 0;
        };
    }

    private String extractLevel(String promoCode) {
        if (promoCode == null) return "BRONZE";
        if (promoCode.startsWith("DIAMOND")) return "DIAMOND";
        if (promoCode.startsWith("GOLD"))    return "GOLD";
        if (promoCode.startsWith("SILVER"))  return "SILVER";
        return "BRONZE";
    }
}