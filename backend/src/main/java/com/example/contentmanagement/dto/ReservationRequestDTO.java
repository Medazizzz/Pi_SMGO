package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
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
public class ReservationRequestDTO {
    @NotBlank(message = "seanceId is required")
    private String seanceId;

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "numeroPlace is required")
    private String numeroPlace;

    @Positive(message = "prix must be positive")
    private double prix;

    private String contenuId;
    private String watchPartyId;
}
