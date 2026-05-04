package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeanceOccupancyTrainingSampleDTO {
    private String seanceId;
    private String cinemaId;
    private String salleId;
    private String contenuId;
    private LocalDate dateSeance;
    private String heureSeance;
    private int salleCapacity;
    private int soldSeats;
    private double tauxRemplissageFinal;
    private LocalDateTime generatedAt;
}
