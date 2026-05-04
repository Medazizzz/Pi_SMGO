package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Date;

@Document(collection = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    private String id;

    private Date dateReservation;
    private String numeroPlace;
    private List<String> numeroPlaces;
    private String statut;
    private String watchPartyId;
    private String contenuId;
    private String userId;
    private double prix;
    private String seanceId;
    private String salleId;
    private String paymentSessionId;
    private Date expiresAt;
}
