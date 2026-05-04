package com.example.contentmanagement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    // ML Prediction Fields
    @JsonProperty("salle_capacity")
    private Double salleCapacity;

    @JsonProperty("seats_reserved")
    private Double seatsReserved;

    @JsonProperty("heure_num")
    private Double heureNum;

    @JsonProperty("day_of_week_num")
    private Double dayOfWeekNum;

    @JsonProperty("is_weekend")
    private Integer isWeekend;

    @JsonProperty("is_holiday")
    private Integer isHoliday;

    @JsonProperty("is_school_vacation")
    private Integer isSchoolVacation;

    @JsonProperty("is_before_holiday")
    private Integer isBeforeHoliday;

    @JsonProperty("month")
    private Integer month;

    @JsonProperty("avg_taux_cinema")
    private Double avgTauxCinema;

    @JsonProperty("avg_taux_salle")
    private Double avgTauxSalle;

    @JsonProperty("avg_taux_creneau")
    private Double avgTauxCreneau;

    @JsonProperty("avg_taux_contenu")
    private Double avgTauxContenu;

    @JsonProperty("history_cinema")
    private Integer historyCinema;

    @JsonProperty("history_salle")
    private Integer historySalle;
}
