package com.example.contentmanagement.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Document(collection = "posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Post {

    @Id
    private String id;

    private String titre;
    private String contenu;
    private Date datePublication;

    private String authorId;
    private String authorUsername;
    private int commentCount;
    private String imageUrl;
    private int forYouScore;

    @Builder.Default
    private Map<String, Set<String>> reactions = new HashMap<>();

    @Builder.Default
    private Set<String> viewedBy = new HashSet<>();

    @Builder.Default
    private String toxicityLevel = "SAFE";

    @Builder.Default
    private boolean hidden = false;

    public int getVues() {
        return viewedBy != null ? viewedBy.size() : 0;
    }

    public boolean addView(String userId) {
        if (viewedBy == null) viewedBy = new HashSet<>();
        return viewedBy.add(userId);
    }
}