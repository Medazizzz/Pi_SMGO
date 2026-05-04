package com.example.contentmanagement.dto;

import com.example.contentmanagement.entity.AbonnementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class AbonnementRequestDTO {

    @NotNull(message = "Subscription type is required")
    private AbonnementType type;

    @Positive(message = "Price must be positive")
    private double prix;

    @NotBlank(message = "Description is required")
    private String description;
}
