package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.WatchPartyRepository;
import com.example.contentmanagement.service.WatchPartyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchPartyServiceImpl implements WatchPartyService {

    private static final String DEFAULT_PARTICIPANT_ID = "guest";
    private final WatchPartyRepository watchPartyRepository;

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
    public WatchParty create(WatchPartyRequestDTO request) {
        WatchParty watchParty = WatchParty.builder()
                .titre(request.getTitre())
                .contenuId(request.getContenuId())
                .dateCreation(new Date())
                .statut("ACTIVE")
                .participantIds(new ArrayList<>())
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
        watchPartyRepository.delete(watchParty);
    }

    private String resolveUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return DEFAULT_PARTICIPANT_ID;
        }
        return userId.trim();
    }
}
