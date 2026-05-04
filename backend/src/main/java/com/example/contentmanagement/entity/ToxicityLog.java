package com.example.contentmanagement.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

/**
 * Log d'audit pour chaque analyse de toxicité.
 * Collection séparée pour traçabilité complète.
 */
@Document(collection = "toxicity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ToxicityLog {

    @Id
    private String id;

    private String targetId;        // ID du post ou commentaire
    private String targetType;      // "POST" ou "COMMENTAIRE"
    private String authorId;        // ID de l'auteur
    private String authorUsername;

    private int rawScore;           // Score brut avant contexte
    private double contextMultiplier; // Multiplicateur historique
    private int finalScore;         // Score final après contexte

    private ToxicityLevel level;    // Niveau détecté
    private List<String> detectedWords; // Mots détectés
    private String action;          // Action appliquée
    private Date analyzedAt;        // Date d'analyse
}