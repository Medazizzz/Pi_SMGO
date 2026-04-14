package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.entity.JoinRequest;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.WatchPartyRepository;
import com.example.contentmanagement.repository.JoinRequestRepository;
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

        List<String> participants = watchParty.getParticipantIds() == null
                ? new ArrayList<>()
                : new ArrayList<>(watchParty.getParticipantIds());

        if (!participants.contains(resolvedUserId)) {
            participants.add(resolvedUserId);
        }

        watchParty.setParticipantIds(participants);
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
        watchParty.setParticipantIds(participants);
        watchParty.setUpdatedAt(new Date());

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
        // ✅ Supprimer aussi les demandes de join associées
        joinRequestRepository.deleteByWatchPartyId(id);
        watchPartyRepository.delete(watchParty);
    }

    // ✅ Join request management
    @Override
    public JoinRequest createJoinRequest(String watchPartyId, String userId) {
        // ✅ Vérifier que la watchparty existe
        getById(watchPartyId);
        String resolvedUserId = resolveUserId(userId);

        // ✅ Vérifier si une demande existe déjà (pending)
        Optional<JoinRequest> existing = joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, resolvedUserId);
        if (existing.isPresent() && "pending".equals(existing.get().getStatus())) {
            return existing.get(); // Retourner la demande existante
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
        WatchParty watchParty = join(watchPartyId, userId);

        Optional<JoinRequest> request = joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, userId);
        if (request.isPresent()) {
            JoinRequest jr = request.get();
            jr.setStatus("approved");
            jr.setRespondedAt(new Date());
            joinRequestRepository.save(jr);
        }

        watchParty.setUpdatedAt(new Date());
        return watchPartyRepository.save(watchParty);
    }

    @Override
    public WatchParty rejectJoinRequest(String watchPartyId, String userId) {
        WatchParty watchParty = getById(watchPartyId);

        Optional<JoinRequest> request = joinRequestRepository.findByWatchPartyIdAndUserId(watchPartyId, userId);
        if (request.isPresent()) {
            JoinRequest jr = request.get();
            jr.setStatus("rejected");
            jr.setRespondedAt(new Date());
            joinRequestRepository.save(jr);
        }

        watchParty.setUpdatedAt(new Date());
        return watchPartyRepository.save(watchParty);
    }
    private String resolveUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return DEFAULT_PARTICIPANT_ID;
        }
        return userId.trim();
    }

    @Override
    public WatchParty cancelWatchParty(String id) {
        WatchParty watchParty = getById(id);
        watchParty.setStatut("CANCELLED");
        watchParty.setUpdatedAt(new Date());
        return watchPartyRepository.save(watchParty);
    }

}

