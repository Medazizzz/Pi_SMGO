package com.example.contentmanagement.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeanceRequestDTO {
    @NotNull(message = "dateSeance is required")
    @FutureOrPresent(message = "dateSeance must be today or in the future")
    private LocalDate dateSeance;

    @NotBlank(message = "heureSeance is required")
    private String heureSeance;

    @NotBlank(message = "salleId is required")
    private String salleId;

    @NotBlank(message = "cinemaId is required")
    private String cinemaId;

    private String contenuId;
}
