package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.ReactionResponseDTO;
import com.example.contentmanagement.service.CommentaireReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireReactionController {

    private final CommentaireReactionService commentaireReactionService;

    // ✅ Toggle réaction sur un commentaire
    @PostMapping("/{id}/reactions")
    public ResponseEntity<ReactionResponseDTO> toggleReaction(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        String reactionType = body.get("reactionType");

        return ResponseEntity.ok(
                commentaireReactionService.toggleReaction(id, reactionType, userId));
    }

    // ✅ Lire les réactions d'un commentaire
    @GetMapping("/{id}/reactions")
    public ResponseEntity<ReactionResponseDTO> getReactions(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : null;

        return ResponseEntity.ok(
                commentaireReactionService.getReactions(id, userId));
    }
}