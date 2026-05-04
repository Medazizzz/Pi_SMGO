package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.CommentaireRequestDTO;
import com.example.contentmanagement.dto.CommentaireResponseDTO;

import java.util.List;

public interface CommentaireService {
    CommentaireResponseDTO create(CommentaireRequestDTO dto);
    List<CommentaireResponseDTO> getAll();
    CommentaireResponseDTO getById(String id);
    List<CommentaireResponseDTO> getByPostId(String postId);
    CommentaireResponseDTO update(String id, CommentaireRequestDTO dto);
    void delete(String id);
}
