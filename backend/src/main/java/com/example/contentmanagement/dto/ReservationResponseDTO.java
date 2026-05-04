package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponseDTO {
    private String id;
    private String seanceId;
    private Date dateReservation;
    private String numeroPlace;
    private List<String> numeroPlaces;
    private String statut;
    private double prix;
    private String userId;
    private String userName;
    private String contenuId;
    private String salleId;
    private String paymentSessionId;
    private Date expiresAt;
    private String nomCinema;
    private String numeroSalle;
    private LocalDate dateSeance;
    private String heureSeance;
}
