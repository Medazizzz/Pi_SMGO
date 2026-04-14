package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.WatchPartySearchResultDTO;

import java.util.List;

public interface WatchPartySearchService {
    List<WatchPartySearchResultDTO> searchWatchParties(String keyword);
}