package com.example.contentmanagement.service.IA;

import com.example.contentmanagement.dto.SentimentRequestDTO;
import com.example.contentmanagement.dto.SentimentResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SentimentApiService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String predictSentiment(String comment) {
        String url = "http://127.0.0.1:5000/predict-sentiment";

        SentimentRequestDTO request = new SentimentRequestDTO(comment);

        ResponseEntity<SentimentResponseDTO> response =
                restTemplate.postForEntity(url, request, SentimentResponseDTO.class);

        if (response.getBody() != null) {
            return response.getBody().getSentiment();
        }

        return "NEUTRE";
    }
}