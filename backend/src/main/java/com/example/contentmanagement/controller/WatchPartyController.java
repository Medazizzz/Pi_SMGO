package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.WatchPartyRecommendationDTO;
import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.dto.WatchPartyRiskDTO;
import com.example.contentmanagement.entity.JoinRequest;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.service.WatchPartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/watchparty")
@RequiredArgsConstructor
public class WatchPartyController {

    private final WatchPartyService watchPartyService;

    @GetMapping
    public ResponseEntity<List<WatchParty>> getAll() {
        return ResponseEntity.ok(watchPartyService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WatchParty> getById(@PathVariable String id) {
        return ResponseEntity.ok(watchPartyService.getById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(
            @Valid @RequestBody WatchPartyRequestDTO request,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null || authentication.getName().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
            }

            WatchParty created = watchPartyService.create(request, authentication.getName());
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> join(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(required = false) String userId) {
        try {
            String resolvedUserId = resolveUser(authentication, userId);
            return ResponseEntity.ok(watchPartyService.join(id, resolvedUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leave(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(required = false) String userId) {
        try {
            String resolvedUserId = resolveUser(authentication, userId);
            return ResponseEntity.ok(watchPartyService.leave(id, resolvedUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/close-for-all")
    public ResponseEntity<?> closeForAll(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(required = false) String userId) {
        try {
            String resolvedUserId = resolveUser(authentication, userId);
            return ResponseEntity.ok(watchPartyService.closeSessionForAll(id, resolvedUserId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<String>> getParticipants(@PathVariable String id) {
        return ResponseEntity.ok(watchPartyService.getParticipants(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        watchPartyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/add-participant")
    public ResponseEntity<?> addParticipant(
            @PathVariable String id,
            @RequestParam String userId) {
        try {
            return ResponseEntity.ok(watchPartyService.join(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelWatchParty(@PathVariable String id) {
        try {
            return ResponseEntity.ok(watchPartyService.cancelWatchParty(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/join-request")
    public ResponseEntity<?> createJoinRequest(
            @PathVariable String id,
            Authentication authentication,
            @RequestParam(required = false) String userId) {
        try {
            String resolvedUserId = resolveUser(authentication, userId);
            JoinRequest created = watchPartyService.createJoinRequest(id, resolvedUserId);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/join-requests")
    public ResponseEntity<List<JoinRequest>> getJoinRequests(@PathVariable String id) {
        return ResponseEntity.ok(watchPartyService.getJoinRequests(id));
    }

    @PostMapping("/{id}/approve-join")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable String id,
            @RequestParam String userId) {
        try {
            return ResponseEntity.ok(watchPartyService.approveJoinRequest(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject-join")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable String id,
            @RequestParam String userId) {
        try {
            return ResponseEntity.ok(watchPartyService.rejectJoinRequest(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private String resolveUser(Authentication authentication, String userId) {
        if (authentication != null && authentication.getName() != null && !authentication.getName().trim().isEmpty()) {
            return authentication.getName();
        }

        if (userId != null && !userId.trim().isEmpty()) {
            return userId.trim();
        }

        throw new RuntimeException("User not authenticated and userId not provided");
    }

    @GetMapping("/{id}/score")
    public ResponseEntity<Double> getWatchPartyScore(@PathVariable String id) {
        return ResponseEntity.ok(watchPartyService.calculateScore(id));
    }


    @GetMapping("/{id}/risk")
    public ResponseEntity<WatchPartyRiskDTO> detectRisk(@PathVariable String id) {
        return ResponseEntity.ok(watchPartyService.detectRisk(id));
    }

    @GetMapping("/risks")
    public ResponseEntity<List<WatchPartyRiskDTO>> detectAllRisks() {
        return ResponseEntity.ok(watchPartyService.detectAllRisks());
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<WatchPartyRecommendationDTO>> getRecommendations() {
        return ResponseEntity.ok(watchPartyService.getRecommendedWatchParties());
    }
}