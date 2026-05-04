package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.service.ModerationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GroqModerationServiceImpl implements ModerationService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean containsBadWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        String lowerText = text.toLowerCase();

        List<String> bannedWords = Arrays.asList(
                "fuck", "shit", "bitch", "idiot", "stupid", "asshole"
        );

        for (String word : bannedWords) {
            if (lowerText.contains(word)) {
                return true;
            }
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content",
                    "You are a moderation system. Detect offensive, insulting, vulgar, obscene, or toxic language in user feedback. " +
                            "Reply with only one word: BLOCK if the text contains inappropriate language, otherwise ALLOW."
            );

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", text);

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(systemMessage);
            messages.add(userMessage);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    requestBody == null ? null : requestEntity,
                    Map.class
            );

            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                return false;
            }

            Object choicesObj = responseBody.get("choices");
            if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
                return false;
            }

            Object firstChoiceObj = choices.get(0);
            if (!(firstChoiceObj instanceof Map<?, ?> firstChoice)) {
                return false;
            }

            Object messageObj = firstChoice.get("message");
            if (!(messageObj instanceof Map<?, ?> messageMap)) {
                return false;
            }

            Object contentObj = messageMap.get("content");
            if (contentObj == null) {
                return false;
            }

            String result = contentObj.toString().trim().toUpperCase();
            return result.contains("BLOCK");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}