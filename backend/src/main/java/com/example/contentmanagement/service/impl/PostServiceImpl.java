package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.PostRequestDTO;
import com.example.contentmanagement.dto.PostResponseDTO;
import com.example.contentmanagement.entity.Post;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    public PostResponseDTO createPost(PostRequestDTO dto) {
        User author = resolveCurrentUser();

        Post post = Post.builder()
                .titre(dto.getTitre())
                .contenu(dto.getContenu())
                .datePublication(new Date())
                .authorId(author.getId())
                .authorUsername(author.getUsername())
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
        return toResponse(postRepository.save(post));
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

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
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
        return dto;
    }
}
