package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponseDTO {
    private String id;
    private Date dateReservation;
    private String numeroPlace;
    private String statut;
    private double prix;
    private String userId;
    private String contenuId;
    private String nomCinema;
    private String numeroSalle;
    private LocalDate dateSeance;
    private String heureSeance;
}
