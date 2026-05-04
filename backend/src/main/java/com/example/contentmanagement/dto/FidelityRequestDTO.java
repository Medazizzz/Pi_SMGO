package com.example.contentmanagement.dto;

import com.example.contentmanagement.entity.FidelityLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class FidelityRequestDTO {

    @Min(value = 0, message = "Points must be non-negative")
    private int points;

    @NotNull(message = "Fidelity level is required")
    private FidelityLevel level;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 300, message = "Description must contain between 5 and 300 characters")
    private String description;
}
