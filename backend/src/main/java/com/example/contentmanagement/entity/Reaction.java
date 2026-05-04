package com.example.contentmanagement.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "reactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reaction {

    @Id
    private String id;

    private String targetId;      // ID du commentaire
    private String targetType;    // "COMMENTAIRE"
    private String userId;        // ID de l'utilisateur
    private String reactionType;  // "LIKE", "LOVE", etc.
    private Date createdAt;
}