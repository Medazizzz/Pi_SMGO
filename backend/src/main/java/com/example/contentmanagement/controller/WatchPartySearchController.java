package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.WatchPartySearchResultDTO;
import com.example.contentmanagement.service.WatchPartySearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/watchparty/search")
@RequiredArgsConstructor
public class WatchPartySearchController {

    private final WatchPartySearchService watchPartySearchService;

    @GetMapping
    public ResponseEntity<List<WatchPartySearchResultDTO>> search(
            @RequestParam String keyword
    ) {
        return ResponseEntity.ok(watchPartySearchService.searchWatchParties(keyword));
    }
}