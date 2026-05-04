package com.example.contentmanagement.dto;

public class SentimentResponseDTO {
    private String sentiment;

    public SentimentResponseDTO() {
    }

    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }
}