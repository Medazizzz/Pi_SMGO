package com.example.contentmanagement.dto;

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
public class SeanceResponseDTO {
    private String id;
    private LocalDate dateSeance;
    private String heureSeance;
    private String numeroSalle;
    private String nomCinema;
    private String contenuId;
}
