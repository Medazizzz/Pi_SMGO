package com.example.contentmanagement.dto;

import lombok.Data;

import java.util.Date;

@Data
public class PostResponseDTO {
    private String id;
    private String titre;
    private String contenu;
    private Date datePublication;
    private String authorUsername;
}
