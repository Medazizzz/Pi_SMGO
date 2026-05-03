package com.example.contentmanagement.controller;

import com.example.contentmanagement.service.CardValidationService;
import com.example.contentmanagement.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService        paymentService;
    private final CardValidationService cardValidationService;

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(
            @RequestBody Map<String, Object> request) {

        // ── Étape 1 : valider la carte ─────────────
        Map<String, String> cardData = Map.of(
                "cardNumber", request.get("cardNumber").toString(),
                "expiryDate", request.get("expiryDate").toString(),
                "cvv",        request.get("cvv").toString(),
                "cardHolder", request.get("cardHolder").toString()
        );

        Map<String, Object> validation =
                cardValidationService.validateCard(cardData);

        // ── Étape 2 : si carte invalide → refuser ──
        if (!(Boolean) validation.get("approved")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success",    false,
                    "message",    validation.get("message"),
                    "trustScore", validation.get("trustScore"),
                    "cardType",   validation.get("cardType"),
                    "checks",     validation.get("checks")
            ));
        }

        // ── Étape 3 : carte valide → sauvegarder ───
        Map<String, Object> paymentResult =
                paymentService.processPayment(request);

        // Ajouter les infos de validation dans la réponse
        paymentResult.put("trustScore", validation.get("trustScore"));
        paymentResult.put("cardType",   validation.get("cardType"));
        paymentResult.put("maskedCard", validation.get("maskedCard"));

        return ResponseEntity.ok(paymentResult);
    }
}