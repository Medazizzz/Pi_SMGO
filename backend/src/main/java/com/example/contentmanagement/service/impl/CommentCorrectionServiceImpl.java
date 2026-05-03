package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.CommentCorrectionRequest;
import com.example.contentmanagement.service.CommentCorrectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommentCorrectionServiceImpl implements CommentCorrectionService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String correctEnglishComment(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        String systemPrompt = """
                You are an English grammar and spelling corrector.
                Correct the user's feedback in English only.
                Keep the exact same meaning and tone.
                Do not translate.
                Do not summarize.
                Do not explain.
                Return only the corrected text.
                """;

        Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "temperature", 0.1,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", systemPrompt
                        ),
                        Map.of(
                                "role", "user",
                                "content", text
                        )
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            if (response.getBody() == null) {
                return text;
            }

            Object choicesObj = response.getBody().get("choices");
            if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
                return text;
            }

            Object firstChoice = choices.get(0);
            if (!(firstChoice instanceof Map<?, ?> firstChoiceMap)) {
                return text;
            }

            Object messageObj = firstChoiceMap.get("message");
            if (!(messageObj instanceof Map<?, ?> messageMap)) {
                return text;
            }

            Object contentObj = messageMap.get("content");
            if (!(contentObj instanceof String corrected)) {
                return text;
            }

            return corrected.trim();
        } catch (Exception e) {
            return text;
        }
    }
}