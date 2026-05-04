package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "seance_occupancy_training_samples")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeanceOccupancyTrainingSample {

    @Id
    private String id;

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
