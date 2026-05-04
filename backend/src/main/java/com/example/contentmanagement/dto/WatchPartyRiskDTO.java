package com.example.contentmanagement.dto;

public class WatchPartyRiskDTO {

    private String watchPartyId;
    private String titre;
    private String riskLevel;
    private int participantCount;
    private int feedbackCount;
    private int negativeFeedbackCount;
    private int toxicFeedbackCount;
    private double averageNote;
    private String reason;
    private double score;

    public WatchPartyRiskDTO() {}

    public WatchPartyRiskDTO(String watchPartyId, String titre, String riskLevel,
                             int participantCount, int feedbackCount,
                             int negativeFeedbackCount, int toxicFeedbackCount,
                             double averageNote, String reason) {
        this.watchPartyId = watchPartyId;
        this.titre = titre;
        this.riskLevel = riskLevel;
        this.participantCount = participantCount;
        this.feedbackCount = feedbackCount;
        this.negativeFeedbackCount = negativeFeedbackCount;
        this.toxicFeedbackCount = toxicFeedbackCount;
        this.averageNote = averageNote;
        this.reason = reason;
        this.score = score;

    }

    public String getWatchPartyId() { return watchPartyId; }
    public void setWatchPartyId(String watchPartyId) { this.watchPartyId = watchPartyId; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public int getParticipantCount() { return participantCount; }
    public void setParticipantCount(int participantCount) { this.participantCount = participantCount; }

    public int getFeedbackCount() { return feedbackCount; }
    public void setFeedbackCount(int feedbackCount) { this.feedbackCount = feedbackCount; }

    public int getNegativeFeedbackCount() { return negativeFeedbackCount; }
    public void setNegativeFeedbackCount(int negativeFeedbackCount) { this.negativeFeedbackCount = negativeFeedbackCount; }

    public int getToxicFeedbackCount() { return toxicFeedbackCount; }
    public void setToxicFeedbackCount(int toxicFeedbackCount) { this.toxicFeedbackCount = toxicFeedbackCount; }

    public double getAverageNote() { return averageNote; }
    public void setAverageNote(double averageNote) { this.averageNote = averageNote; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
}