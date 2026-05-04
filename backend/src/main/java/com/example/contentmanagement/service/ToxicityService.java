package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.*;
import com.example.contentmanagement.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.time.LocalDateTime;

/**
 * Service de détection de contenu toxique.
 *
 * Algorithme en 4 niveaux :
 * 1. Scoring brut — somme des poids des mots du dictionnaire JSON détectés
 * 2. Multiplicateur contextuel — basé sur l'historique de l'auteur
 * 3. Score final — scoreBrut × multiplicateur
 * 4. Action automatique — selon le niveau ToxicityLevel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ToxicityService {

    private final PostRepository postRepository;
    private final CommentaireRepository commentaireRepository;
    private final UserRepository userRepository;
    private final ToxicityLogRepository toxicityLogRepository;

    // ─── Dictionnaire chargé depuis badword.json ──────────────────────────────
    private final Map<String, Integer> TOXIC_WORDS = new HashMap<>();

    @PostConstruct
    public void loadBadWords() {
        try {
            ClassPathResource resource = new ClassPathResource("badword.json");
            ObjectMapper mapper = new ObjectMapper();
            List<String> words = mapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<List<String>>() {}
            );

            for (String word : words) {
                // ✅ Attribution automatique des poids selon la longueur du mot
                int weight;
                if (word.length() <= 4) {
                    weight = 10; // INSULTES graves
                } else if (word.length() <= 7) {
                    weight = 8;  // HAINE
                } else if (word.length() <= 10) {
                    weight = 5;  // MOYEN
                } else {
                    weight = 3;  // LÉGER
                }
                TOXIC_WORDS.put(word.toLowerCase(), weight);
            }
            // ✅ Mots communs manquants dans le fichier JSON
            TOXIC_WORDS.put("stupid", 10);
            TOXIC_WORDS.put("idiot", 10);
            TOXIC_WORDS.put("hate", 8);
            TOXIC_WORDS.put("kill", 8);
            TOXIC_WORDS.put("moron", 10);
            TOXIC_WORDS.put("destroy", 8);
            TOXIC_WORDS.put("ugly", 5);
            TOXIC_WORDS.put("dumb", 8);
            TOXIC_WORDS.put("loser", 8);
            TOXIC_WORDS.put("awful", 5);
            TOXIC_WORDS.put("terrible", 5);
            TOXIC_WORDS.put("horrible", 5);
            TOXIC_WORDS.put("trash", 8);
            TOXIC_WORDS.put("worthless", 8);
            TOXIC_WORDS.put("useless", 5);
            TOXIC_WORDS.put("shut up", 5);
            TOXIC_WORDS.put("die", 10);
            TOXIC_WORDS.put("dead", 5);
            TOXIC_WORDS.put("freak", 5);
            TOXIC_WORDS.put("jerk", 8);
            TOXIC_WORDS.put("pathetic", 8);
            TOXIC_WORDS.put("disgusting", 8);
            TOXIC_WORDS.put("gross", 5);
            TOXIC_WORDS.put("lame", 3);
            TOXIC_WORDS.put("dumbass", 10);
            TOXIC_WORDS.put("dumbshit", 10);
            TOXIC_WORDS.put("scum", 8);
            TOXIC_WORDS.put("garbage", 8);
            TOXIC_WORDS.put("piece of crap", 10);
            TOXIC_WORDS.put("go to hell", 10);
            TOXIC_WORDS.put("shut your mouth", 8);
            TOXIC_WORDS.put("get lost", 5);
            TOXIC_WORDS.put("nobody cares", 5);
            TOXIC_WORDS.put("you suck", 8);
            TOXIC_WORDS.put("loser", 8);
            TOXIC_WORDS.put("waste of time", 5);
            TOXIC_WORDS.put("get out", 3);



            log.info("✅ Dictionnaire chargé : {} mots toxiques", TOXIC_WORDS.size());
        } catch (Exception e) {
            log.error("❌ Erreur chargement badword.json : {}", e.getMessage());
        }
    }

    // ─── Seuil de violations pour multiplicateur ──────────────────────────────
    private static final int VIOLATION_THRESHOLD = 3;
    private static final double REPEAT_OFFENDER_MULTIPLIER = 1.5;
    private static final double NEW_USER_MULTIPLIER = 1.2;

    /**
     * Analyse un post et applique l'action appropriée.
     */
    public ToxicityLog analyzePost(Post post) {
        return analyze(
                post.getId(),
                "POST",
                post.getTitre() + " " + post.getContenu(),
                post.getAuthorId(),
                post.getAuthorUsername()
        );
    }

    /**
     * Analyse un commentaire et applique l'action appropriée.
     */
    public ToxicityLog analyzeCommentaire(Commentaire commentaire) {
        return analyze(
                commentaire.getId(),
                "COMMENTAIRE",
                commentaire.getContenu(),
                commentaire.getAuthorId(),
                commentaire.getAuthorUsername()
        );
    }

    /**
     * Algorithme principal d'analyse.
     */
    private ToxicityLog analyze(String targetId, String targetType,
                                String content, String authorId,
                                String authorUsername) {

        // ─── Étape 1 : Scoring brut ───────────────────────────────────────────
        String lowerContent = content.toLowerCase();
        List<String> detectedWords = new ArrayList<>();
        int rawScore = 0;

        for (Map.Entry<String, Integer> entry : TOXIC_WORDS.entrySet()) {
            if (lowerContent.contains(entry.getKey())) {
                detectedWords.add(entry.getKey());
                rawScore += entry.getValue();
            }
        }




// ─── Étape 2 : Multiplicateur contextuel

        // ─── Étape 2 : Multiplicateur contextuel ─────────────────────────────
        double multiplier = calculateMultiplier(authorId);

        // ─── Étape 3 : Score final ────────────────────────────────────────────
        int finalScore = (int) Math.round(rawScore * multiplier);

        // ─── Étape 4 : Déterminer le niveau ──────────────────────────────────
        ToxicityLevel level = ToxicityLevel.fromScore(finalScore);

        // ─── Étape 5 : Appliquer l'action ────────────────────────────────────
        String action = applyAction(targetId, targetType, level);

        // ─── Étape 6 : Sauvegarder le log ────────────────────────────────────
        ToxicityLog toxicityLog = ToxicityLog.builder()
                .targetId(targetId)
                .targetType(targetType)
                .authorId(authorId)
                .authorUsername(authorUsername)
                .rawScore(rawScore)
                .contextMultiplier(multiplier)
                .finalScore(finalScore)
                .level(level)
                .detectedWords(detectedWords)
                .action(action)
                .analyzedAt(new Date())
                .build();

        toxicityLogRepository.save(toxicityLog);

        log.info("Toxicity analysis — {}/{} — score: {} — level: {} — action: {}",
                targetType, targetId, finalScore, level, action);

        return toxicityLog;
    }

    /**
     * Calcule le multiplicateur basé sur l'historique de l'auteur.
     * Récidiviste (3+ violations) → ×1.5
     * Nouvel utilisateur           → ×1.2
     * Utilisateur normal           → ×1.0
     */
    private double calculateMultiplier(String authorId) {
        long violations = toxicityLogRepository.countByAuthorIdAndLevelIn(
                authorId,
                List.of(ToxicityLevel.HIDDEN, ToxicityLevel.DELETED)
        );

        if (violations >= VIOLATION_THRESHOLD) {
            return REPEAT_OFFENDER_MULTIPLIER;
        }

        Optional<User> user = userRepository.findById(authorId);
        if (user.isPresent() && isNewUser(user.get())) {
            return NEW_USER_MULTIPLIER;
        }

        return 1.0;
    }

    /**
     * Vérifie si l'utilisateur a été créé il y a moins de 7 jours.
     */
    private boolean isNewUser(User user) {
        if (user.getCreatedAt() == null) return false;
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        return user.getCreatedAt().isAfter(sevenDaysAgo);
    }

    /**
     * Applique l'action selon le niveau de toxicité.
     */
    private String applyAction(String targetId, String targetType,
                               ToxicityLevel level) {
        switch (level) {
            case SAFE:
                if ("POST".equals(targetType)) {
                    postRepository.findById(targetId).ifPresent(post -> {
                        if (!"SAFE".equals(post.getToxicityLevel())) {
                            post.setToxicityLevel("SAFE");
                            post.setHidden(false);
                            postRepository.save(post);
                        }
                    });
                }
                return "NONE";

            case WARNING:
                if ("POST".equals(targetType)) {
                    postRepository.findById(targetId).ifPresent(post -> {
                        post.setToxicityLevel("WARNING");
                        postRepository.save(post);
                    });
                }
                return "MARKED_WARNING";

            case HIDDEN:
                if ("POST".equals(targetType)) {
                    postRepository.findById(targetId).ifPresent(post -> {
                        post.setToxicityLevel("HIDDEN");
                        post.setHidden(true);
                        postRepository.save(post);
                    });
                } else {
                    commentaireRepository.findById(targetId).ifPresent(c -> {
                        c.setHidden(true);
                        commentaireRepository.save(c);
                    });
                }
                return "AUTO_HIDDEN";

            case DELETED:
                if ("POST".equals(targetType)) {
                    postRepository.deleteById(targetId);
                } else {
                    commentaireRepository.deleteById(targetId);
                }
                return "AUTO_DELETED";

            default:
                return "NONE";
        }
    }
}