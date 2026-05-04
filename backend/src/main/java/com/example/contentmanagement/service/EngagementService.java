package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.CommentaireRepository;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.repository.ReactionRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service de calcul du score d'engagement utilisateur.
 *
 * Croise 3 collections : posts + commentaires + reactions
 * Score = (posts × 5) + (commentaires × 2) + (réactions × 1)
 *
 * Niveaux :
 *   0-10   → BRONZE  → 5%
 *   11-30  → SILVER  → 10%
 *   31-50  → GOLD    → 15%
 *   51+    → DIAMOND → 20%
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EngagementService {

    private final PostRepository postRepository;
    private final CommentaireRepository commentaireRepository;
    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;

    public enum EngagementLevel {
        BRONZE("🥉 Bronze", 5, 0, 10),
        SILVER("🥈 Silver", 10, 11, 30),
        GOLD("🥇 Gold", 15, 31, 50),
        DIAMOND("💎 Diamond", 20, 51, Integer.MAX_VALUE);

        public final String label;
        public final int discountPercent;
        public final int minScore;
        public final int maxScore;

        EngagementLevel(String label, int discountPercent, int minScore, int maxScore) {
            this.label = label;
            this.discountPercent = discountPercent;
            this.minScore = minScore;
            this.maxScore = maxScore;
        }

        public static EngagementLevel fromScore(int score) {
            for (EngagementLevel level : values()) {
                if (score >= level.minScore && score <= level.maxScore) {
                    return level;
                }
            }
            return BRONZE;
        }
    }

    public record EngagementResult(
            String userId,
            String username,
            int postsCount,
            int commentairesCount,
            int reactionsCount,
            int totalScore,
            EngagementLevel level
    ) {}

    /**
     * Calcule le score d'engagement d'un utilisateur.
     * Croise posts + commentaires + reactions.
     */
    public EngagementResult calculateEngagement(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // ✅ Collection 1 — Posts créés par l'utilisateur
        long postsCount = postRepository.findAll().stream()
                .filter(p -> userId.equals(p.getAuthorId()))
                .count();

        // ✅ Collection 2 — Commentaires créés par l'utilisateur
        long commentairesCount = commentaireRepository.findAll().stream()
                .filter(c -> userId.equals(c.getAuthorId()))
                .count();

        // ✅ Collection 3 — Réactions données par l'utilisateur
        long reactionsCount = reactionRepository.findAll().stream()
                .filter(r -> userId.equals(r.getUserId()))
                .count();

        // ✅ Calcul du score
        int totalScore = (int) ((postsCount * 5) + (commentairesCount * 2) + (reactionsCount * 1));
        EngagementLevel level = EngagementLevel.fromScore(totalScore);

        log.info("Engagement — User: {} | Posts: {} | Commentaires: {} | Reactions: {} | Score: {} | Level: {}",
                user.getUsername(), postsCount, commentairesCount, reactionsCount, totalScore, level.label);

        return new EngagementResult(
                userId,
                user.getUsername(),
                (int) postsCount,
                (int) commentairesCount,
                (int) reactionsCount,
                totalScore,
                level
        );
    }
}