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

@Document(collection = "seance_occupancy_temporal_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeanceOccupancyTemporalSnapshot {

    @Id
    private String id;

    private String seanceId;
    private String cinemaId;
    private String salleId;
    private String contenuId;
    private LocalDate dateSeance;
    private String heureSeance;
    private int salleCapacity;
    private int horizonHoursBeforeSeance;
    private LocalDateTime snapshotAt;
    private int seatsReservedAtSnapshot;
    private double tauxRemplissageSnapshot;
    private int soldSeatsFinal;
    private double tauxRemplissageFinal;
    private int historyWindowSize;
    private int historyCountCinema;
    private int historyCountSalle;
    private int historyCountCreneau;
    private int historyCountContenu;
    private double avgTauxRemplissageCinemaLastN;
    private double avgTauxRemplissageSalleLastN;
    private double avgTauxRemplissageCreneauLastN;
    private double avgTauxRemplissageContenuLastN;
    private int dayOfWeek;
    private int isWeekend;
    private int isHoliday;
    private int isSchoolVacation;
    private int isBeforeHoliday;
    private int month;
    private String season;
    private LocalDateTime generatedAt;
}
