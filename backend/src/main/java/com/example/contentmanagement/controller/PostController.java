package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.PostRequestDTO;
import com.example.contentmanagement.dto.PostResponseDTO;
import com.example.contentmanagement.dto.ReactionResponseDTO;
import com.example.contentmanagement.entity.Post;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.service.PostService;
import com.example.contentmanagement.service.ToxicityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ToxicityService toxicityService;
    private final PostRepository postRepository;

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
    public ResponseEntity<PostResponseDTO> update(@PathVariable String id,
                                                  @Valid @RequestBody PostRequestDTO dto) {
        return ResponseEntity.ok(postService.updatePost(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/with-stats")
    public ResponseEntity<List<PostResponseDTO>> getPostsWithStats() {
        return ResponseEntity.ok(postService.getPostsWithCommentCount());
    }

    @PostMapping("/{id}/reactions")
    public ResponseEntity<ReactionResponseDTO> toggleReaction(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        String reactionType = body.get("reactionType");
        return ResponseEntity.ok(postService.toggleReaction(id, reactionType, userId));
    }

    @GetMapping("/for-you")
    public ResponseEntity<List<PostResponseDTO>> getForYouPage() {
        return ResponseEntity.ok(postService.getPostsForYouPage());
    }

    // ✅ Endpoint test — analyse immédiate
    @PostMapping("/{id}/analyze")
    public ResponseEntity<Void> analyzePost(@PathVariable String id) {
        postRepository.findById(id).ifPresent(toxicityService::analyzePost);
        return ResponseEntity.ok().build();
    }
}