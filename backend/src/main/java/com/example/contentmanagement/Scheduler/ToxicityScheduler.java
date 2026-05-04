package com.example.contentmanagement.Scheduler;

import com.example.contentmanagement.entity.Commentaire;
import com.example.contentmanagement.entity.Post;
import com.example.contentmanagement.repository.CommentaireRepository;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.service.ToxicityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduler de détection de toxicité.
 *
 * Tourne toutes les heures et réanalyse :
 * 1. Tous les posts non supprimés
 * 2. Tous les commentaires
 *
 * Si un post masqué a été édité → réévalue son score.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ToxicityScheduler {

    private final PostRepository postRepository;
    private final CommentaireRepository commentaireRepository;
    private final ToxicityService toxicityService;

    @Scheduled(fixedRate =  30000) // ✅ toutes les heures
    public void analyzeToxicity() {
        log.info("🔍 ToxicityScheduler — Démarrage de l'analyse...");

        int postsAnalyzed = 0;
        int postsHidden = 0;
        int postsDeleted = 0;
        int commentairesAnalyzed = 0;

        // ─── Analyse des posts ────────────────────────────────────────────────
        List<Post> posts = postRepository.findAll();
        for (Post post : posts) {
            try {
                var log2 = toxicityService.analyzePost(post);
                postsAnalyzed++;

                switch (log2.getLevel()) {
                    case HIDDEN -> postsHidden++;
                    case DELETED -> postsDeleted++;
                    default -> {}
                }
            } catch (Exception e) {
                log.error("Erreur analyse post {}: {}", post.getId(), e.getMessage());
            }
        }

        // ─── Analyse des commentaires ─────────────────────────────────────────
        List<Commentaire> commentaires = commentaireRepository.findAll();
        for (Commentaire commentaire : commentaires) {
            try {
                toxicityService.analyzeCommentaire(commentaire);
                commentairesAnalyzed++;
            } catch (Exception e) {
                log.error("Erreur analyse commentaire {}: {}", commentaire.getId(), e.getMessage());
            }
        }

        log.info("✅ ToxicityScheduler terminé — Posts: {} analysés, {} masqués, {} supprimés | Commentaires: {} analysés",
                postsAnalyzed, postsHidden, postsDeleted, commentairesAnalyzed);
    }
}