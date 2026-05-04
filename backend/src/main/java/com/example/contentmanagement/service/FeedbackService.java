package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.FeedbackCreateRequestDTO;
import com.example.contentmanagement.dto.FeedbackUpdateRequestDTO;
import com.example.contentmanagement.entity.Feedback;

import java.util.List;

public interface FeedbackService {
    List<Feedback> getAll();
    List<Feedback> getByWatchParty(String watchPartyId);
    Feedback create(FeedbackCreateRequestDTO request);
    Feedback update(String id, FeedbackUpdateRequestDTO request);
    void delete(String id);
    Feedback like(String id, String userId);
    Feedback dislike(String id, String userId);
}
