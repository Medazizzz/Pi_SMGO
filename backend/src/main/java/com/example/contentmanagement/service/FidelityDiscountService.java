package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.FidelityDiscountDTO;
import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FidelityDiscountService {

    private final UserRepository userRepository;
    private final AbonnementRepository abonnementRepository;
    private final MongoTemplate mongoTemplate;

    // ================================================================
    // RÈGLES MÉTIER
    // ================================================================
    private static final double POINTS_PER_DT    = 100.0;
    private static final double MAX_DISCOUNT_PCT  = 0.50;
    private static final int    MIN_POINTS_TO_USE = 100;

    // ================================================================
    // INFOS GÉNÉRALES
    // ================================================================
    public FidelityDiscountDTO getDiscountInfo(String userId, String abonnementId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User non trouvé"));

        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement non trouvé"));

        double originalPrice     = abonnement.getPrix();
        double maxDiscountAmount = originalPrice * MAX_DISCOUNT_PCT;
        int maxUsablePoints      = (int) Math.min(
                maxDiscountAmount * POINTS_PER_DT,
                user.getFidelityScore()
        );

        return FidelityDiscountDTO.builder()
                .userId(userId)
                .currentFidelityScore(user.getFidelityScore())
                .abonnementId(abonnementId)
                .planType(abonnement.getType() != null ? abonnement.getType().name() : "")
                .originalPrice(originalPrice)
                .maxUsablePoints(maxUsablePoints)
                .maxDiscountAmount(Math.round(maxDiscountAmount * 100.0) / 100.0)
                .conversionRate(POINTS_PER_DT)
                .applied(false)
                .message(String.format(
                        "Vous pouvez utiliser jusqu'à %d pts pour une remise de %.2f DT (50%% max)",
                        maxUsablePoints, maxDiscountAmount))
                .build();
    }

    // ================================================================
    // SIMULER UNE REMISE (sans appliquer)
    // ================================================================
    public FidelityDiscountDTO simulate(String userId,
                                        String abonnementId,
                                        int pointsToUse) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User non trouvé : " + userId));

        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement non trouvé : " + abonnementId));

        return compute(user, abonnement, pointsToUse, false);
    }

    // ================================================================
    // APPLIQUER LA REMISE (déduit les points du user)
    // ================================================================
    public FidelityDiscountDTO apply(String userId,
                                     String abonnementId,
                                     int pointsToUse) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User non trouvé : " + userId));

        Abonnement abonnement = abonnementRepository.findById(abonnementId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement non trouvé : " + abonnementId));

        // Valider avant d'appliquer
        String validationError = validate(user, abonnement, pointsToUse);
        if (validationError != null) {
            return FidelityDiscountDTO.builder()
                    .userId(userId)
                    .currentFidelityScore(user.getFidelityScore())
                    .message(validationError)
                    .applied(false)
                    .build();
        }

        // Calculer la remise
        FidelityDiscountDTO result = compute(user, abonnement, pointsToUse, true);

        // ✅ Déduire les points directement via MongoTemplate
        Query query = new Query(Criteria.where("_id").is(userId));
        Update update = new Update().inc("fidelityScore", -pointsToUse);
        mongoTemplate.updateFirst(query, update, User.class);

        log.info("[FidelityDiscount] ✅ Remise appliquée | userId={} | points déduits={} | remise={}DT | prix final={}DT",
                userId, pointsToUse, result.getDiscountAmount(), result.getFinalPrice());

        return result;
    }

    // ================================================================
    // CALCUL PRINCIPAL
    // ================================================================
    private FidelityDiscountDTO compute(User user,
                                        Abonnement abonnement,
                                        int pointsToUse,
                                        boolean applied) {

        double originalPrice     = abonnement.getPrix();
        double fidelityScore     = user.getFidelityScore();
        double maxDiscountAmount = originalPrice * MAX_DISCOUNT_PCT;
        int maxUsablePoints      = (int) (maxDiscountAmount * POINTS_PER_DT);

        // Clamp : ne pas dépasser le max ni le solde du user
        int effectivePoints = Math.min(pointsToUse, maxUsablePoints);
        effectivePoints     = Math.min(effectivePoints, (int) fidelityScore);
        effectivePoints     = Math.max(effectivePoints, 0);

        double discountAmount = effectivePoints / POINTS_PER_DT;
        double finalPrice     = Math.max(0, originalPrice - discountAmount);
        int remainingPoints   = (int) (fidelityScore - effectivePoints);

        String message = applied
                ? String.format("✅ Remise de %.2f DT appliquée ! Prix final : %.2f DT. Points restants : %d",
                discountAmount, finalPrice, remainingPoints)
                : String.format("💡 Simulation : %d pts → -%.2f DT | Prix final : %.2f DT",
                effectivePoints, discountAmount, finalPrice);

        return FidelityDiscountDTO.builder()
                .userId(user.getId())
                .currentFidelityScore(fidelityScore)
                .abonnementId(abonnement.getId())
                .planType(abonnement.getType() != null ? abonnement.getType().name() : "")
                .originalPrice(originalPrice)
                .pointsToUse(effectivePoints)
                .discountAmount(Math.round(discountAmount * 100.0) / 100.0)
                .finalPrice(Math.round(finalPrice * 100.0) / 100.0)
                .remainingPoints(remainingPoints)
                .maxUsablePoints(maxUsablePoints)
                .maxDiscountAmount(Math.round(maxDiscountAmount * 100.0) / 100.0)
                .conversionRate(POINTS_PER_DT)
                .applied(applied)
                .message(message)
                .build();
    }

    // ================================================================
    // VALIDATION
    // ================================================================
    private String validate(User user, Abonnement abonnement, int pointsToUse) {

        if (user.getFidelityScore() < MIN_POINTS_TO_USE) {
            return "❌ Points insuffisants. Minimum requis : " + MIN_POINTS_TO_USE + " pts";
        }

        if (pointsToUse < MIN_POINTS_TO_USE) {
            return "❌ Vous devez utiliser au moins " + MIN_POINTS_TO_USE + " pts";
        }

        if (pointsToUse > user.getFidelityScore()) {
            return "❌ Vous n'avez que " + (int) user.getFidelityScore() + " pts disponibles";
        }

        if (abonnement.getPrix() <= 0) {
            return "❌ Prix de l'abonnement invalide";
        }

        return null;
    }
}