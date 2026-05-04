package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.entity.WatchParty;

import java.util.List;

public interface WatchPartyService {
    List<WatchParty> getAll();
    WatchParty getById(String id);
    WatchParty create(WatchPartyRequestDTO request);
    WatchParty join(String id, String userId);
    WatchParty leave(String id, String userId);
    List<String> getParticipants(String id);
    void delete(String id);
}
