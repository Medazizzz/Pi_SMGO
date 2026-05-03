package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final AbonnementRepository abonnementRepo;
    private final UserRepository       userRepo;

    public Map<String, Object> processPayment(Map<String, Object> request) {

        String userId        = (String) request.get("userId");
        String abonnementId  = (String) request.get("abonnementId");
        String abonnementType= (String) request.get("abonnementType");
        double amount        = Double.parseDouble(request.get("amount").toString());

        log.info("💳 Paiement reçu — user: {} | plan: {} | montant: {}",
                userId, abonnementType, amount);

        // ── Créer l'abonnement pour le user ───────────
        Abonnement newAbonnement = new Abonnement();
        newAbonnement.setUserId(userId);
        newAbonnement.setType(com.example.contentmanagement.entity.AbonnementType
                .valueOf(abonnementType));
        newAbonnement.setPrix(amount);
        newAbonnement.setDescription("Subscribed via payment");
        abonnementRepo.save(newAbonnement);

        log.info("✅ Abonnement créé pour user [{}]", userId);

        // ── Réponse succès ─────────────────────────────
        Map<String, Object> response = new HashMap<>();
        response.put("success",       true);
        response.put("message",       "Payment successful!");
        response.put("transactionId", UUID.randomUUID().toString());
        response.put("abonnementId",  newAbonnement.getId());
        response.put("amount",        amount);

        return response;
    }
}