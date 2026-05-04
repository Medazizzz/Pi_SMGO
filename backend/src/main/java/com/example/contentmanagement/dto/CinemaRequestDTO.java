package com.example.contentmanagement.dto;

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
public class CinemaRequestDTO {
    @NotBlank(message = "nom is required")
    private String nom;

    @NotBlank(message = "adresse is required")
    private String adresse;

    @NotBlank(message = "ville is required")
    private String ville;
}
