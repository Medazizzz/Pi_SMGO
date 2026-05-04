package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.WatchPartyAnalyticsDTO;
import com.example.contentmanagement.service.WatchPartyAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/watchparty/analytics")
@RequiredArgsConstructor
public class WatchPartyAnalyticsController {

    private final WatchPartyAnalyticsService watchPartyAnalyticsService;

    @GetMapping
    public ResponseEntity<List<WatchPartyAnalyticsDTO>> getAnalytics() {
        return ResponseEntity.ok(watchPartyAnalyticsService.getWatchPartyAnalytics());
    }
}