package com.example.contentmanagement.dto;

public record CommentCorrectionResponse(
        String originalText,
        String correctedText
) {
}