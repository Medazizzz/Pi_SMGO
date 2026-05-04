package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireResponseDTO {
    private String id;
    private String contenu;
    private String postId;
    private String authorUsername;
    private Date dateCommentaire;
}
