package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.ReactionResponseDTO;
import com.example.contentmanagement.entity.Reaction;
import com.example.contentmanagement.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service gérant les réactions sur les commentaires.
 * Utilise une collection séparée "reactions" — pattern scalable
 * identique à Instagram/Facebook.
 *
 * Règle métier :
 *   - 1 utilisateur = 1 réaction par commentaire (toggle)
 *   - Changer d'emoji = remplace l'ancienne réaction
 *   - Cliquer même emoji = retire la réaction
 */
@Service
@RequiredArgsConstructor
public class CommentaireReactionService {

    private final ReactionRepository reactionRepository;
    private static final String TARGET_TYPE = "COMMENTAIRE";

    /**
     * Toggle une réaction sur un commentaire.
     * Croise 2 collections : reactions + commentaires (via targetId)
     */
    public ReactionResponseDTO toggleReaction(
            String commentaireId, String reactionType, String userId) {

        // Cherche la réaction existante de cet utilisateur
        Optional<Reaction> existing = reactionRepository
                .findByTargetIdAndTargetTypeAndUserId(commentaireId, TARGET_TYPE, userId);

        boolean added = false;

        if (existing.isPresent()) {
            Reaction current = existing.get();
            if (current.getReactionType().equals(reactionType)) {
                // Même emoji → toggle off (supprimer)
                reactionRepository.delete(current);
            } else {
                // Autre emoji → remplacer
                current.setReactionType(reactionType);
                current.setCreatedAt(new Date());
                reactionRepository.save(current);
                added = true;
            }
        } else {
            // Pas de réaction → ajouter
            Reaction reaction = Reaction.builder()
                    .targetId(commentaireId)
                    .targetType(TARGET_TYPE)
                    .userId(userId)
                    .reactionType(reactionType)
                    .createdAt(new Date())
                    .build();
            reactionRepository.save(reaction);
            added = true;
        }

        return buildResponse(commentaireId, userId);
    }

    /**
     * Récupère les compteurs de réactions pour un commentaire.
     * Utilise findByTargetIdAndTargetType — keyword multi-champs.
     */
    public ReactionResponseDTO getReactions(String commentaireId, String userId) {
        return buildResponse(commentaireId, userId);
    }

    /**
     * Récupère les réactions pour une liste de commentaires.
     * Utile pour charger tous les compteurs en une fois.
     */
    public Map<String, ReactionResponseDTO> getReactionsForCommentaires(
            List<String> commentaireIds, String userId) {

        Map<String, ReactionResponseDTO> result = new HashMap<>();
        for (String id : commentaireIds) {
            result.put(id, buildResponse(id, userId));
        }
        return result;
    }

    private ReactionResponseDTO buildResponse(String commentaireId, String userId) {
        List<Reaction> reactions = reactionRepository
                .findByTargetIdAndTargetType(commentaireId, TARGET_TYPE);

        // Compteurs par type
        Map<String, Integer> counts = new HashMap<>();
        String userReaction = null;

        for (Reaction r : reactions) {
            counts.merge(r.getReactionType(), 1, Integer::sum);
            if (r.getUserId().equals(userId)) {
                userReaction = r.getReactionType();
            }
        }

        int total = counts.values().stream().mapToInt(Integer::intValue).sum();

        return ReactionResponseDTO.builder()
                .postId(commentaireId)
                .reactionCounts(counts)
                .userReaction(userReaction)
                .totalReactions(total)
                .added(userReaction != null)
                .build();
    }
}