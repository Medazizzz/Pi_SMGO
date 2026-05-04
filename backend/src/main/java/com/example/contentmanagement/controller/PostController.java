package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.PostRequestDTO;
import com.example.contentmanagement.dto.PostResponseDTO;
import com.example.contentmanagement.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponseDTO> create(@Valid @RequestBody PostRequestDTO dto) {
        return ResponseEntity.status(201).body(postService.createPost(dto));
    }

    @GetMapping
    public ResponseEntity<List<PostResponseDTO>> getAll() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponseDTO> update(@PathVariable String id, @Valid @RequestBody PostRequestDTO dto) {
        return ResponseEntity.ok(postService.updatePost(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
