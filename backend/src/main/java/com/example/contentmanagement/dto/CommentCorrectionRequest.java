package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentCorrectionRequest(
        @NotBlank(message = "Text is required")
        String text
) {
}