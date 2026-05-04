package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.WatchPartyRequestDTO;
import com.example.contentmanagement.entity.WatchParty;
import com.example.contentmanagement.service.WatchPartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

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
    public ResponseEntity<WatchParty> create(@Valid @RequestBody WatchPartyRequestDTO request) {
        return new ResponseEntity<>(watchPartyService.create(request), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<WatchParty> join(@PathVariable String id, @RequestParam(required = false) String userId) {
        return ResponseEntity.ok(watchPartyService.join(id, userId));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<WatchParty> leave(@PathVariable String id, @RequestParam(required = false) String userId) {
        return ResponseEntity.ok(watchPartyService.leave(id, userId));
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
}
