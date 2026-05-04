package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WatchPartyRecommendationDTO {
    private String id;
    private String titre;
    private String statut;
    private int nombreParticipants;
    private double moyenneFeedback;
    private long nombreFeedbacks;
    private double scoreRecommendation;
}