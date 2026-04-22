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
import com.example.contentmanagement.service.ModerationService;
import com.example.contentmanagement.service.IA.SentimentApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final WatchPartyRepository watchPartyRepository;
    private final SentimentApiService sentimentApiService;
    private final ModerationService moderationService;

    @Value("${app.audio.upload-dir:uploads/audio}")
    private String uploadDir;

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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "WatchParty not found with id: " + request.getWatchPartyId()
                ));

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : watchParty.getParticipantIds();

        boolean isParticipant = participants.contains(resolvedClientId);
        boolean isHost = resolvedClientId.equals(watchParty.getClientId())
                || resolvedClientId.equals(watchParty.getAdminId());

        if (!isParticipant && !isHost) {
            throw new UnauthorizedException("Only members can add feedback.");
        }

        if (moderationService.containsBadWords(request.getCommentaire())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Feedback contains inappropriate language."
            );
        }

        String sentiment;
        try {
            sentiment = sentimentApiService.predictSentiment(request.getCommentaire());
        } catch (Exception e) {
            sentiment = "UNKNOWN";
        }

        Feedback feedback = Feedback.builder()
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .watchPartyId(request.getWatchPartyId())
                .dateFeedback(new Date())
                .clientId(resolvedClientId)
                .sentiment(sentiment)
                .build();

        return feedbackRepository.save(feedback);
    }

    @Override
    public Feedback createWithAudio(int note,
                                    String commentaire,
                                    String watchPartyId,
                                    MultipartFile audioFile,
                                    String clientId) throws IOException {

        String resolvedClientId = resolveClientId(clientId);

        WatchParty watchParty = watchPartyRepository.findById(watchPartyId)
                .orElseThrow(() -> new ResourceNotFoundException("WatchParty not found"));

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : watchParty.getParticipantIds();

        boolean isParticipant = participants.contains(resolvedClientId);
        boolean isHost = resolvedClientId.equals(watchParty.getClientId())
                || resolvedClientId.equals(watchParty.getAdminId());

        if (!isParticipant && !isHost) {
            throw new UnauthorizedException("Only members can add feedback.");
        }

        boolean hasText = commentaire != null && !commentaire.trim().isEmpty();
        boolean hasAudio = audioFile != null && !audioFile.isEmpty();

        if (!hasText && !hasAudio) {
            throw new RuntimeException("Feedback must contain text or audio.");
        }

        if (hasText && moderationService.containsBadWords(commentaire)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Feedback contains inappropriate language."
            );
        }

        String sentiment = "UNKNOWN";
        if (hasText) {
            try {
                sentiment = sentimentApiService.predictSentiment(commentaire);
            } catch (Exception e) {
                sentiment = "UNKNOWN";
            }
        }

        String audioUrl = null;

        if (hasAudio) {
            String contentType = audioFile.getContentType();

            if (contentType == null || !contentType.startsWith("audio/")) {
                throw new RuntimeException("File must be audio.");
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = audioFile.getOriginalFilename() != null
                    ? audioFile.getOriginalFilename()
                    : "audio.webm";

            String extension = "";
            int dotIndex = originalName.lastIndexOf(".");
            if (dotIndex >= 0) {
                extension = originalName.substring(dotIndex);
            }

            if (extension.isBlank()) {
                if (contentType.contains("mpeg")) {
                    extension = ".mp3";
                } else if (contentType.contains("mp4")) {
                    extension = ".mp4";
                } else if (contentType.contains("ogg")) {
                    extension = ".ogg";
                } else if (contentType.contains("wav")) {
                    extension = ".wav";
                } else {
                    extension = ".webm";
                }
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(audioFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            if (Files.size(filePath) == 0) {
                throw new RuntimeException("Saved audio file is empty.");
            }

            audioUrl = "/uploads/audio/" + fileName;
        }

        Feedback feedback = Feedback.builder()
                .note(note)
                .commentaire(commentaire)
                .watchPartyId(watchPartyId)
                .dateFeedback(new Date())
                .clientId(resolvedClientId)
                .sentiment(sentiment)
                .audioUrl(audioUrl)
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
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        if (moderationService.containsBadWords(request.getCommentaire())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Feedback contains inappropriate language."
            );
        }

        feedback.setNote(request.getNote());
        feedback.setCommentaire(request.getCommentaire());

        try {
            feedback.setSentiment(
                    sentimentApiService.predictSentiment(request.getCommentaire())
            );
        } catch (Exception e) {
            feedback.setSentiment("UNKNOWN");
        }

        return feedbackRepository.save(feedback);
    }

    @Override
    public void delete(String id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        feedbackRepository.delete(feedback);
    }

    @Override
    public Feedback like(String id, String userId) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        String resolvedClientId = resolveClientId(userId);

        List<String> likedBy = new ArrayList<>(feedback.getLikedByUserIds());
        List<String> dislikedBy = new ArrayList<>(feedback.getDislikedByUserIds());

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
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));

        String resolvedClientId = resolveClientId(userId);

        List<String> likedBy = new ArrayList<>(feedback.getLikedByUserIds());
        List<String> dislikedBy = new ArrayList<>(feedback.getDislikedByUserIds());

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
            throw new UnauthorizedException("User not found.");
        }
        return userId.trim();
    }
}