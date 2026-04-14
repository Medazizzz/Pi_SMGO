package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchPartySearchResultDTO {

    private String watchPartyId;
    private String titre;
    private String statut;

    private String hostId;
    private String hostUsername;

    private int participantCount;
    private int feedbackCount;

    private String matchedFeedbackComment;
    private String matchedSentiment;
}