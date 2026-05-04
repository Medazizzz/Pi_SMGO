package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.PostRequestDTO;
import com.example.contentmanagement.dto.PostResponseDTO;
import com.example.contentmanagement.dto.ReactionResponseDTO;
import com.example.contentmanagement.entity.Post;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.PostService;
import com.example.contentmanagement.service.ToxicityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ToxicityService toxicityService;

    @Override
    public PostResponseDTO createPost(PostRequestDTO dto) {
        User author = resolveCurrentUser();
        Post post = Post.builder()
                .titre(dto.getTitre())
                .contenu(dto.getContenu())
                .imageUrl(dto.getImageUrl())
                .datePublication(new Date())
                .authorId(author.getId())
                .authorUsername(author.getUsername())
                //.vues(0)
                .reactions(new HashMap<>())
                .build();
        return toResponse(postRepository.save(post));
    }

    @Override
    public List<PostResponseDTO> getAllPosts() {
        return postRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public PostResponseDTO getPostById(String id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        // ✅ Nouveau — récupérer l'userId connecté
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && !"anonymousUser".equals(auth.getName())) {
            String principal = auth.getName();
            User user = userRepository.findByUsername(principal)
                    .or(() -> userRepository.findByEmail(principal))
                    .orElse(null);
            if (user != null && post.addView(user.getId())) {
                postRepository.save(post); // ✅ sauvegarde seulement si nouvelle vue
            }
        }
        return toResponse(post);
    }

    @Override
    public PostResponseDTO updatePost(String id, PostRequestDTO dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        User currentUser = resolveCurrentUser();
        if (!currentUser.getId().equals(post.getAuthorId()) && !isAdmin(currentUser)) {
            throw new RuntimeException("You can only update your own posts");
        }
        post.setTitre(dto.getTitre());
        post.setContenu(dto.getContenu());
        post.setImageUrl(dto.getImageUrl());
        post.setToxicityLevel("SAFE");
        post.setHidden(false);

        Post saved = postRepository.save(post);
        log.info("🔄 Avant analyse — toxicityLevel: {}", saved.getToxicityLevel());
        toxicityService.analyzePost(saved);
        Post updated = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        log.info("✅ Après analyse — toxicityLevel: {}", updated.getToxicityLevel());
        return toResponse(updated);
    }

    @Override
    public void deletePost(String id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        User currentUser = resolveCurrentUser();
        if (!currentUser.getId().equals(post.getAuthorId()) && !isAdmin(currentUser)) {
            throw new RuntimeException("You can only delete your own posts");
        }
        postRepository.deleteById(id);
    }

    @Override
    public List<PostResponseDTO> getPostsWithCommentCount() {
        String userId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && !"anonymousUser".equals(auth.getName())) {
                String principal = auth.getName();
                User user = userRepository.findByUsername(principal)
                        .or(() -> userRepository.findByEmail(principal))
                        .orElse(null);
                if (user != null) userId = user.getId();
            }
        } catch (Exception ignored) {}

        final String currentUserId = userId;
        return postRepository.findPostsWithCommentCount()
                .stream()
                .filter(post -> !post.isHidden()) // ✅ exclure les posts masqués
                .map(post -> toResponseWithUser(post, currentUserId))
                .toList();
    }

    @Override
    public ReactionResponseDTO toggleReaction(String postId, String reactionType, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        Map<String, Set<String>> reactions = post.getReactions();
        if (reactions == null) {
            reactions = new HashMap<>();
            post.setReactions(reactions);
        }

        boolean isSameType = reactions.containsKey(reactionType)
                && reactions.get(reactionType).contains(userId);

        for (Set<String> users : reactions.values()) {
            users.remove(userId);
        }

        boolean wasAdded = false;
        if (!isSameType) {
            reactions.computeIfAbsent(reactionType, k -> new HashSet<>()).add(userId);
            wasAdded = true;
        }

        postRepository.save(post);
        return buildReactionResponse(post, userId, wasAdded);
    }

    private ReactionResponseDTO buildReactionResponse(Post post, String userId, boolean added) {
        Map<String, Integer> counts = new HashMap<>();
        if (post.getReactions() != null) {
            post.getReactions().forEach((k, v) -> {
                if (!v.isEmpty()) counts.put(k, v.size());
            });
        }

        String userReaction = null;
        if (post.getReactions() != null) {
            for (Map.Entry<String, Set<String>> entry : post.getReactions().entrySet()) {
                if (entry.getValue().contains(userId)) {
                    userReaction = entry.getKey();
                    break;
                }
            }
        }

        return ReactionResponseDTO.builder()
                .postId(post.getId())
                .reactionCounts(counts)
                .userReaction(userReaction)
                .totalReactions(counts.values().stream().mapToInt(Integer::intValue).sum())
                .added(added)
                .build();
    }

    private PostResponseDTO toResponseWithUser(Post post, String userId) {
        PostResponseDTO dto = toResponse(post);
        if (userId != null && post.getReactions() != null) {
            for (Map.Entry<String, Set<String>> entry : post.getReactions().entrySet()) {
                if (entry.getValue().contains(userId)) {
                    dto.setUserReaction(entry.getKey());
                    break;
                }
            }
        }
        return dto;
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Authentication required");
        }
        String principal = authentication.getName();
        return userRepository.findByEmail(principal)
                .or(() -> userRepository.findByUsername(principal))
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private boolean isAdmin(User user) {
        String role = user.getRole();
        return role != null && ("ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role));
    }

    private PostResponseDTO toResponse(Post post) {
        PostResponseDTO dto = new PostResponseDTO();
        dto.setId(post.getId());
        dto.setTitre(post.getTitre());
        dto.setContenu(post.getContenu());
        dto.setDatePublication(post.getDatePublication());
        dto.setAuthorUsername(post.getAuthorUsername());
        dto.setImageUrl(post.getImageUrl());
        dto.setVues(post.getVues());
        dto.setCommentCount(post.getCommentCount());
        dto.setToxicityLevel(post.getToxicityLevel());
        dto.setHidden(post.isHidden());
        if (post.getReactions() != null) {
            Map<String, Integer> counts = new HashMap<>();
            post.getReactions().forEach((k, v) -> {
                if (!v.isEmpty()) counts.put(k, v.size());
            });
            dto.setReactionCounts(counts);
        }
        return dto;
    }
    @Override
    public List<PostResponseDTO> getPostsForYouPage() {
        String userId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && !"anonymousUser".equals(auth.getName())) {
                String principal = auth.getName();
                User user = userRepository.findByUsername(principal)
                        .or(() -> userRepository.findByEmail(principal))
                        .orElse(null);
                if (user != null) userId = user.getId();
            }
        } catch (Exception ignored) {}

        final String currentUserId = userId;
        return postRepository.findPostsForYouPage()
                .stream()
                .filter(post -> !post.isHidden())
                .filter(post -> !"WARNING".equals(post.getToxicityLevel())) // ✅ exclure WARNING
                .map(post -> toResponseWithUser(post, currentUserId))
                .toList();
    }
}