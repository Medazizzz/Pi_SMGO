package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchPartyAnalyticsDTO {

    private String watchPartyId;
    private String titre;
    private String statut;
    private Date dateCreation;

    private String hostId;
    private String hostUsername;

    private int participantCount;
    private int feedbackCount;

    private double averageRating;
    private int positiveFeedbackCount;
    private int negativeFeedbackCount;

    private double globalScore;
}