package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireResponseDTO {
    private String id;
    private String contenu;
    private String postId;
    private String authorUsername;
    private Date dateCommentaire;
    private Map<String, Integer> reactionCounts; // { "LIKE": 3 }
    private String userReaction;
}
