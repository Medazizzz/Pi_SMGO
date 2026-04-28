package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.dto.WatchPartyRiskDTO;
import com.example.contentmanagement.entity.Feedback;
import com.example.contentmanagement.entity.JoinRequest;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.FeedbackRepository;
import com.example.contentmanagement.repository.JoinRequestRepository;
import com.example.contentmanagement.repository.WatchPartyRepository;
import com.example.contentmanagement.service.WatchPartyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WatchPartyServiceImpl implements WatchPartyService {

    private static final String DEFAULT_PARTICIPANT_ID = "guest";

    private final WatchPartyRepository watchPartyRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    public List<WatchParty> getAll() {
        return watchPartyRepository.findAll();
    }

    @Override
    public WatchParty getById(String id) {
        return watchPartyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WatchParty not found with id: " + id));
    }

    @Override
    public WatchParty create(WatchPartyRequestDTO request, String hostUserId) {
        String resolvedHostId = resolveUserId(hostUserId);

        List<String> participants = new ArrayList<>();
        participants.add(resolvedHostId);

        Date now = new Date();

        WatchParty watchParty = WatchParty.builder()
                .titre(request.getTitre())
                .contenuId(request.getContenuId())
                .dateCreation(now)
                .updatedAt(now)
                .statut("OPEN")
                .clientId(resolvedHostId)
                .adminId(resolvedHostId)
                .participantIds(participants)
                .pendingUserIds(new ArrayList<>())
                .reservationIds(new ArrayList<>())
                .build();

        return watchPartyRepository.save(watchParty);
    }

    @Override
    public WatchParty join(String id, String userId) {
        WatchParty watchParty = getById(id);
        String resolvedUserId = resolveUserId(userId);

        validateJoinAllowed(watchParty, resolvedUserId);

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getParticipantIds());

        if (!participants.contains(resolvedUserId)) {
            participants.add(resolvedUserId);
        }

        List<String> pendingUsers = watchParty.getPendingUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getPendingUserIds());

        pendingUsers.remove(resolvedUserId);

        watchParty.setParticipantIds(participants);
        watchParty.setPendingUserIds(pendingUsers);
        watchParty.setUpdatedAt(new Date());

        return watchPartyRepository.save(watchParty);
    }

    @Override
    public WatchParty leave(String id, String userId) {
        WatchParty watchParty = getById(id);
        String resolvedUserId = resolveUserId(userId);

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getParticipantIds());

        participants.remove(resolvedUserId);

        List<String> pendingUsers = watchParty.getPendingUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getPendingUserIds());

        pendingUsers.remove(resolvedUserId);

        watchParty.setParticipantIds(participants);
        watchParty.setPendingUserIds(pendingUsers);
        watchParty.setUpdatedAt(new Date());

        // Si plus aucun participant -> fermer la session
        if (participants.isEmpty()) {
            watchParty.setStatut("CLOSED");
            joinRequestRepository.deleteByWatchPartyId(id);
            return watchPartyRepository.save(watchParty);
        }

        // Si le host quitte seulement pour lui, transférer le host au premier participant restant
        boolean isCurrentHost =
                resolvedUserId.equals(resolveUserId(watchParty.getClientId())) ||
                        resolvedUserId.equals(resolveUserId(watchParty.getAdminId()));

        if (isCurrentHost) {
            String newHost = participants.get(0);
            watchParty.setClientId(newHost);
            watchParty.setAdminId(newHost);
        }

        return watchPartyRepository.save(watchParty);
    }

    @Override
    public WatchParty closeSessionForAll(String id, String userId) {
        WatchParty watchParty = getById(id);
        String resolvedUserId = resolveUserId(userId);

        String hostId = resolveUserId(
                watchParty.getClientId() != null ? watchParty.getClientId() : watchParty.getAdminId()
        );

        if (!resolvedUserId.equals(hostId)) {
            throw new RuntimeException("Only the host can close the session for everyone");
        }

        watchParty.setStatut("CLOSED");
        watchParty.setParticipantIds(new ArrayList<>());
        watchParty.setPendingUserIds(new ArrayList<>());
        watchParty.setUpdatedAt(new Date());

        joinRequestRepository.deleteByWatchPartyId(id);

        return watchPartyRepository.save(watchParty);
    }

    @Override
    public List<String> getParticipants(String id) {
        WatchParty watchParty = getById(id);
        return watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getParticipantIds());
    }

    @Override
    public void delete(String id) {
        WatchParty watchParty = getById(id);
        joinRequestRepository.deleteByWatchPartyId(id);
        watchPartyRepository.delete(watchParty);
    }

    @Override
    public JoinRequest createJoinRequest(String watchPartyId, String userId) {
        WatchParty watchParty = getById(watchPartyId);
        String resolvedUserId = resolveUserId(userId);

        validateJoinAllowed(watchParty, resolvedUserId);

        List<String> pendingUsers = watchParty.getPendingUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getPendingUserIds());

        if (pendingUsers.contains(resolvedUserId)) {
            Optional<JoinRequest> existingPending =
                    joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, resolvedUserId);

            if (existingPending.isPresent() && "pending".equalsIgnoreCase(existingPending.get().getStatus())) {
                return existingPending.get();
            }

            throw new RuntimeException("Join request already pending");
        }

        pendingUsers.add(resolvedUserId);
        watchParty.setPendingUserIds(pendingUsers);
        watchParty.setUpdatedAt(new Date());
        watchPartyRepository.save(watchParty);

        Optional<JoinRequest> existing =
                joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, resolvedUserId);

        if (existing.isPresent() && "pending".equalsIgnoreCase(existing.get().getStatus())) {
            return existing.get();
        }

        JoinRequest request = JoinRequest.builder()
                .watchPartyId(watchPartyId)
                .userId(resolvedUserId)
                .status("pending")
                .requestedAt(new Date())
                .build();

        return joinRequestRepository.save(request);
    }

    @Override
    public List<JoinRequest> getJoinRequests(String watchPartyId) {
        return joinRequestRepository.findByWatchPartyId(watchPartyId);
    }

    @Override
    public WatchParty approveJoinRequest(String watchPartyId, String userId) {
        WatchParty watchParty = getById(watchPartyId);
        String resolvedUserId = resolveUserId(userId);

        String status = normalizeStatus(watchParty.getStatut());
        if (!"OPEN".equals(status)) {
            throw new RuntimeException("Cannot approve request because this WatchParty is closed");
        }

        List<String> pendingUsers = watchParty.getPendingUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getPendingUserIds());

        if (!pendingUsers.contains(resolvedUserId)) {
            throw new RuntimeException("No pending request found for this user");
        }

        pendingUsers.remove(resolvedUserId);
        watchParty.setPendingUserIds(pendingUsers);
        watchParty.setUpdatedAt(new Date());
        watchPartyRepository.save(watchParty);

        WatchParty updatedWatchParty = join(watchPartyId, resolvedUserId);

        Optional<JoinRequest> request =
                joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, resolvedUserId);

        if (request.isPresent()) {
            JoinRequest jr = request.get();
            jr.setStatus("approved");
            jr.setRespondedAt(new Date());
            joinRequestRepository.save(jr);
        }

        updatedWatchParty.setUpdatedAt(new Date());
        return watchPartyRepository.save(updatedWatchParty);
    }

    @Override
    public WatchParty rejectJoinRequest(String watchPartyId, String userId) {
        WatchParty watchParty = getById(watchPartyId);
        String resolvedUserId = resolveUserId(userId);

        List<String> pendingUsers = watchParty.getPendingUserIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getPendingUserIds());

        pendingUsers.remove(resolvedUserId);
        watchParty.setPendingUserIds(pendingUsers);
        watchParty.setUpdatedAt(new Date());

        Optional<JoinRequest> request =
                joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, resolvedUserId);

        if (request.isPresent()) {
            JoinRequest jr = request.get();
            jr.setStatus("rejected");
            jr.setRespondedAt(new Date());
            joinRequestRepository.save(jr);
        }

        return watchPartyRepository.save(watchParty);
    }

    @Override
    public WatchParty cancelWatchParty(String id) {
        WatchParty watchParty = getById(id);
        watchParty.setStatut("CANCELLED");
        watchParty.setUpdatedAt(new Date());
        return watchPartyRepository.save(watchParty);
    }

    private void validateJoinAllowed(WatchParty watchParty, String userId) {
        String status = normalizeStatus(watchParty.getStatut());

        if (!"OPEN".equals(status)) {
            throw new RuntimeException("This WatchParty is closed. Join request is not allowed.");
        }

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : watchParty.getParticipantIds();

        if (participants.contains(userId)) {
            throw new RuntimeException("User is already a participant");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "UNKNOWN";
        }
        return status.trim().toUpperCase();
    }

    private String resolveUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return DEFAULT_PARTICIPANT_ID;
        }
        return userId.trim();
    }
    @Override
    public double calculateScore(String watchPartyId) {

        WatchParty watchParty = watchPartyRepository.findById(watchPartyId)
                .orElseThrow(() -> new RuntimeException("WatchParty not found"));

        int nombreParticipants = watchParty.getParticipantIds() != null
                ? watchParty.getParticipantIds().size()
                : 0;

        List<Feedback> feedbacks = feedbackRepository.findByWatchPartyId(watchPartyId);

        int nombreFeedbacks = feedbacks.size();

        double moyenneNote = feedbacks.stream()
                .mapToDouble(Feedback::getNote)
                .average()
                .orElse(0.0);

        return (nombreParticipants * 2) + (nombreFeedbacks * 1) + (moyenneNote * 3);
    }


    @Override
    public WatchPartyRiskDTO detectRisk(String watchPartyId) {

        WatchParty wp = watchPartyRepository.findById(watchPartyId)
                .orElseThrow(() -> new RuntimeException("WatchParty not found"));

        List<Feedback> feedbacks = feedbackRepository.findByWatchPartyId(watchPartyId);

        int participantCount = wp.getParticipantIds() != null
                ? wp.getParticipantIds().size()
                : 0;

        int feedbackCount = feedbacks.size();

        double averageNote = feedbacks.stream()
                .mapToInt(Feedback::getNote)
                .average()
                .orElse(0.0);

        int negativeFeedbackCount = (int) feedbacks.stream()
                .filter(f -> f.getNote() <= 2)
                .count();

        int toxicFeedbackCount = (int) feedbacks.stream()
                .filter(f ->
                        f.getCommentaire() != null &&
                                (
                                        f.getCommentaire().toLowerCase().contains("fuck") ||
                                                f.getCommentaire().toLowerCase().contains("shit") ||
                                                f.getCommentaire().toLowerCase().contains("bad")
                                )
                )
                .count();

        String riskLevel = "SAFE";
        String reason = "WatchParty stable";

        if (toxicFeedbackCount >= 2 || negativeFeedbackCount >= 3 || averageNote > 0 && averageNote < 2) {
            riskLevel = "HIGH_RISK";
            reason = "High risk: toxic or negative feedback detected";
        } else if (toxicFeedbackCount == 1 || negativeFeedbackCount >= 1 || participantCount == 0) {
            riskLevel = "MEDIUM_RISK";
            reason = "Medium risk: low participation or negative feedback";
        }
        double score = calculateScore(watchPartyId);

        return new WatchPartyRiskDTO(
                wp.getId(),
                wp.getTitre(),
                riskLevel,
                participantCount,
                feedbackCount,
                negativeFeedbackCount,
                toxicFeedbackCount,
                averageNote,
                reason
        );
    }

    @Override
    public List<WatchPartyRiskDTO> detectAllRisks() {
        return watchPartyRepository.findAll()
                .stream()
                .map(wp -> detectRisk(wp.getId()))
                .toList();
    }
}