package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.CommentaireRequestDTO;
import com.example.contentmanagement.dto.CommentaireResponseDTO;
import com.example.contentmanagement.service.CommentaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;

    @PostMapping
    public ResponseEntity<CommentaireResponseDTO> create(@Valid @RequestBody CommentaireRequestDTO dto) {
        return ResponseEntity.status(201).body(commentaireService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<CommentaireResponseDTO>> getAll() {
        return ResponseEntity.ok(commentaireService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentaireResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(commentaireService.getById(id));
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentaireResponseDTO>> getByPostId(@PathVariable String postId) {
        return ResponseEntity.ok(commentaireService.getByPostId(postId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentaireResponseDTO> update(@PathVariable String id, @Valid @RequestBody CommentaireRequestDTO dto) {
        return ResponseEntity.ok(commentaireService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        commentaireService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
