package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.entity.JoinRequest;
import com.example.contentmanagement.entity.WatchParty;

import java.util.List;

public interface WatchPartyService {

    List<WatchParty> getAll();

    WatchParty getById(String id);

    WatchParty create(WatchPartyRequestDTO request, String hostUserId);

    WatchParty join(String id, String userId);

    WatchParty leave(String id, String userId);

    WatchParty closeSessionForAll(String id, String userId);

    List<String> getParticipants(String id);

    void delete(String id);

    JoinRequest createJoinRequest(String watchPartyId, String userId);

    List<JoinRequest> getJoinRequests(String watchPartyId);

    WatchParty approveJoinRequest(String watchPartyId, String userId);

    WatchParty rejectJoinRequest(String watchPartyId, String userId);

    WatchParty cancelWatchParty(String id);
}