package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.CommentaireRequestDTO;
import com.example.contentmanagement.dto.CommentaireResponseDTO;
import com.example.contentmanagement.entity.Commentaire;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CommentaireRepository;
import com.example.contentmanagement.repository.PostRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    public CommentaireResponseDTO create(CommentaireRequestDTO dto) {
        if (!postRepository.existsById(dto.getPostId())) {
            throw new ResourceNotFoundException("Post not found with id: " + dto.getPostId());
        }

        User author = resolveCurrentUser();

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(dto.getContenu());
        commentaire.setPostId(dto.getPostId());
        commentaire.setDateCommentaire(new Date());
        commentaire.setAuthorId(author.getId());
        commentaire.setAuthorUsername(author.getUsername());

        return toResponse(commentaireRepository.save(commentaire));
    }

    @Override
    public List<CommentaireResponseDTO> getAll() {
        return commentaireRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public CommentaireResponseDTO getById(String id) {
        Commentaire c = commentaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
        return toResponse(c);
    }

    @Override
    public List<CommentaireResponseDTO> getByPostId(String postId) {
        return commentaireRepository.findByPostId(postId).stream().map(this::toResponse).toList();
    }

    @Override
    public CommentaireResponseDTO update(String id, CommentaireRequestDTO dto) {
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        User currentUser = resolveCurrentUser();
        if (!currentUser.getId().equals(commentaire.getAuthorId()) && !isAdmin(currentUser)) {
            throw new RuntimeException("You can only update your own comments");
        }

        commentaire.setContenu(dto.getContenu());
        return toResponse(commentaireRepository.save(commentaire));
    }

    @Override
    public void delete(String id) {
        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        User currentUser = resolveCurrentUser();
        if (!currentUser.getId().equals(commentaire.getAuthorId()) && !isAdmin(currentUser)) {
            throw new RuntimeException("You can only delete your own comments");
        }

        commentaireRepository.deleteById(id);
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

    private CommentaireResponseDTO toResponse(Commentaire c) {
        return new CommentaireResponseDTO(
                c.getId(),
                c.getContenu(),
                c.getPostId(),
                c.getAuthorUsername(),
                c.getDateCommentaire()
        );
    }
}
