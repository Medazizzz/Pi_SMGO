package com.example.contentmanagement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackUpdateRequestDTO {
    @Min(value = 1, message = "note must be >= 1")
    @Max(value = 5, message = "note must be <= 5")
    private int note;

    @NotBlank(message = "commentaire is required")
    private String commentaire;
}
