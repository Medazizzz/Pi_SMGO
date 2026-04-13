package com.example.contentmanagement.dto;

public class SentimentRequestDTO {
    private String comment;

    public SentimentRequestDTO() {
    }

    public SentimentRequestDTO(String comment) {
        this.comment = comment;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}