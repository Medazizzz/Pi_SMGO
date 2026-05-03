package com.example.contentmanagement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class CardValidationService {

    public Map<String, Object> validateCard(Map<String, String> cardData) {

        String cardNumber = cardData.get("cardNumber").replaceAll("\\s", "");
        String expiryDate = cardData.get("expiryDate");
        String cvv        = cardData.get("cvv");
        String cardHolder = cardData.get("cardHolder");

        Map<String, Object> result = new HashMap<>();
        Map<String, Object> checks = new HashMap<>();

        boolean luhnValid   = validateLuhn(cardNumber);
        String  cardType    = detectCardType(cardNumber);
        boolean lengthValid = validateLength(cardNumber, cardType);
        boolean expiryValid = validateExpiry(expiryDate);
        boolean cvvValid    = validateCvv(cvv, cardType);
        boolean holderValid = validateHolder(cardHolder);

        checks.put("luhn",     Map.of("valid", luhnValid,   "message", luhnValid   ? "Card number valid"   : "Invalid card number"));
        checks.put("expiry",   Map.of("valid", expiryValid, "message", expiryValid ? "Card not expired"    : "Card is expired"));
        checks.put("cvv",      Map.of("valid", cvvValid,    "message", cvvValid    ? "CVV valid"           : "Invalid CVV"));
        checks.put("holder",   Map.of("valid", holderValid, "message", holderValid ? "Card holder valid"   : "Invalid holder name"));
        checks.put("cardType", Map.of("valid", !cardType.equals("UNKNOWN"), "message", "Card type: " + cardType));

        int     trustScore = calculateTrustScore(luhnValid, lengthValid, expiryValid, cvvValid, holderValid, cardType);
        boolean approved   = luhnValid && lengthValid && expiryValid && cvvValid && holderValid;

        result.put("approved",   approved);
        result.put("trustScore", trustScore);
        result.put("cardType",   cardType);
        result.put("maskedCard", maskCardNumber(cardNumber));
        result.put("checks",     checks);
        result.put("message",    approved ? "Payment approved" : "Payment declined");

        log.info("💳 Validation — type: {} | score: {}% | approved: {}", cardType, trustScore, approved);
        return result;
    }

    private boolean validateLuhn(String cardNumber) {
        if (cardNumber == null || cardNumber.isEmpty()) return false;
        int sum = 0;
        boolean alt = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(cardNumber.charAt(i));
            if (alt) { digit *= 2; if (digit > 9) digit -= 9; }
            sum += digit;
            alt = !alt;
        }
        return sum % 10 == 0;
    }

    private String detectCardType(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) return "UNKNOWN";
        if (cardNumber.startsWith("4"))                    return "VISA";
        if (cardNumber.matches("^5[1-5].*"))               return "MASTERCARD";
        if (cardNumber.matches("^2[2-7].*"))               return "MASTERCARD";
        if (cardNumber.startsWith("34") || cardNumber.startsWith("37")) return "AMEX";
        if (cardNumber.startsWith("6011") || cardNumber.startsWith("65")) return "DISCOVER";
        return "UNKNOWN";
    }

    private boolean validateLength(String cardNumber, String cardType) {
        int length = cardNumber.length();
        return switch (cardType) {
            case "AMEX"      -> length == 15;
            case "VISA",
                 "MASTERCARD",
                 "DISCOVER"  -> length == 16;
            default          -> length >= 13 && length <= 19;
        };
    }

    private boolean validateExpiry(String expiryDate) {
        if (expiryDate == null || !expiryDate.matches("\\d{2}/\\d{2}")) return false;
        try {
            YearMonth expiry = YearMonth.parse(expiryDate, DateTimeFormatter.ofPattern("MM/yy"));
            return !expiry.isBefore(YearMonth.now());
        } catch (Exception e) { return false; }
    }

    private boolean validateCvv(String cvv, String cardType) {
        if (cvv == null) return false;
        if (cardType.equals("AMEX")) return cvv.matches("\\d{4}");
        return cvv.matches("\\d{3}");
    }

    private boolean validateHolder(String holder) {
        if (holder == null || holder.trim().length() < 3) return false;
        return holder.trim().contains(" ");
    }

    private int calculateTrustScore(boolean luhn, boolean length,
                                    boolean expiry, boolean cvv,
                                    boolean holder, String cardType) {
        int score = 0;
        if (luhn)                        score += 35;
        if (length)                      score += 15;
        if (expiry)                      score += 20;
        if (cvv)                         score += 20;
        if (holder)                      score += 5;
        if (!cardType.equals("UNKNOWN")) score += 5;
        return score;
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber.length() < 4) return "****";
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }
}