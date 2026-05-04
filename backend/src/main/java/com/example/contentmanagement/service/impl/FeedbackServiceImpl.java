package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.FeedbackCreateRequestDTO;
import com.example.contentmanagement.dto.FeedbackUpdateRequestDTO;
import com.example.contentmanagement.entity.Feedback;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.exception.UnauthorizedException;
import com.example.contentmanagement.repository.FeedbackRepository;
import com.example.contentmanagement.repository.WatchPartyRepository;
import com.example.contentmanagement.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private static final String DEFAULT_CLIENT_ID = "guest";
    private final FeedbackRepository feedbackRepository;
    private final WatchPartyRepository watchPartyRepository;

    @Override
    public List<Feedback> getAll() {
        return feedbackRepository.findAll();
    }

    @Override
    public List<Feedback> getByWatchParty(String watchPartyId) {
        return feedbackRepository.findByWatchPartyId(watchPartyId);
    }

    @Override
    public Feedback create(FeedbackCreateRequestDTO request) {
        String resolvedClientId = resolveClientId(request.getClientId());

        WatchParty watchParty = watchPartyRepository.findById(request.getWatchPartyId())
            .orElseThrow(() -> new ResourceNotFoundException("WatchParty not found with id: " + request.getWatchPartyId()));

        List<String> participants = watchParty.getParticipantIds() == null
            ? new ArrayList<>()
            : watchParty.getParticipantIds();

        if (!participants.contains(resolvedClientId)) {
            throw new UnauthorizedException("Only participants can add feedback to this watchparty.");
        }

        Feedback feedback = Feedback.builder()
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .watchPartyId(request.getWatchPartyId())
                .dateFeedback(new Date())
            .clientId(resolvedClientId)
                .likes(0)
                .dislikes(0)
                .likedByUserIds(new ArrayList<>())
                .dislikedByUserIds(new ArrayList<>())
                .build();
        return feedbackRepository.save(feedback);
    }

    @Override
    public Feedback update(String id, FeedbackUpdateRequestDTO request) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        feedback.setNote(request.getNote());
        feedback.setCommentaire(request.getCommentaire());
        return feedbackRepository.save(feedback);
    }

    @Override
    public void delete(String id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        feedbackRepository.delete(feedback);
    }

    @Override
    public Feedback like(String id, String userId) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        String resolvedClientId = resolveClientId(userId);

        List<String> likedBy = feedback.getLikedByUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(feedback.getLikedByUserIds());
        List<String> dislikedBy = feedback.getDislikedByUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(feedback.getDislikedByUserIds());

        if (likedBy.contains(resolvedClientId)) {
            likedBy.remove(resolvedClientId);
            feedback.setLikes(Math.max(0, feedback.getLikes() - 1));
        } else {
            likedBy.add(resolvedClientId);
            feedback.setLikes(feedback.getLikes() + 1);

            if (dislikedBy.remove(resolvedClientId)) {
                feedback.setDislikes(Math.max(0, feedback.getDislikes() - 1));
            }
        }

        feedback.setLikedByUserIds(likedBy);
        feedback.setDislikedByUserIds(dislikedBy);
        return feedbackRepository.save(feedback);
    }

    @Override
    public Feedback dislike(String id, String userId) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found with id: " + id));
        String resolvedClientId = resolveClientId(userId);

        List<String> likedBy = feedback.getLikedByUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(feedback.getLikedByUserIds());
        List<String> dislikedBy = feedback.getDislikedByUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(feedback.getDislikedByUserIds());

        if (dislikedBy.contains(resolvedClientId)) {
            dislikedBy.remove(resolvedClientId);
            feedback.setDislikes(Math.max(0, feedback.getDislikes() - 1));
        } else {
            dislikedBy.add(resolvedClientId);
            feedback.setDislikes(feedback.getDislikes() + 1);

            if (likedBy.remove(resolvedClientId)) {
                feedback.setLikes(Math.max(0, feedback.getLikes() - 1));
            }
        }

        feedback.setLikedByUserIds(likedBy);
        feedback.setDislikedByUserIds(dislikedBy);
        return feedbackRepository.save(feedback);
    }

    private String resolveClientId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return DEFAULT_CLIENT_ID;
        }
        return userId.trim();
    }
}
