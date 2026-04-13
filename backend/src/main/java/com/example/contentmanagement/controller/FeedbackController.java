package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.FeedbackCreateRequestDTO;
import com.example.contentmanagement.dto.FeedbackUpdateRequestDTO;
import com.example.contentmanagement.entity.Feedback;
import com.example.contentmanagement.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<List<Feedback>> getAll() {
        return ResponseEntity.ok(feedbackService.getAll());
    }

    @GetMapping("/watchparty/{watchPartyId}")
    public ResponseEntity<List<Feedback>> getByWatchParty(@PathVariable String watchPartyId) {
        return ResponseEntity.ok(feedbackService.getByWatchParty(watchPartyId));
    }

    @PostMapping("/add")
    public ResponseEntity<Feedback> create(
            @Valid @RequestBody FeedbackCreateRequestDTO request,
            Authentication authentication) {
        request.setClientId(authentication.getName());
        return new ResponseEntity<>(feedbackService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Feedback> update(
            @PathVariable String id,
            @Valid @RequestBody FeedbackUpdateRequestDTO request) {
        return ResponseEntity.ok(feedbackService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        feedbackService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Feedback> like(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(feedbackService.like(id, authentication.getName()));
    }

    @PostMapping("/{id}/dislike")
    public ResponseEntity<Feedback> dislike(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(feedbackService.dislike(id, authentication.getName()));
    }
}