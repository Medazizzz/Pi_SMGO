package com.example.contentmanagement.dto;

import lombok.Data;

import java.util.Date;
import java.util.Map;


@Data
public class PostResponseDTO {
    private String id;
    private String titre;
    private String contenu;
    private Date datePublication;
    private String authorUsername;
    private String imageUrl;
    private int vues;
    private Map<String, Integer> reactionCounts;
    private String userReaction;// null si pas de réaction
    private int commentCount;
    private String toxicityLevel;
    private boolean hidden;
}
