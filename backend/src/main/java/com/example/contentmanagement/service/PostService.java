package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.PostRequestDTO;
import com.example.contentmanagement.dto.PostResponseDTO;
import com.example.contentmanagement.entity.Post;
import java.util.List;
import com.example.contentmanagement.dto.ReactionResponseDTO;

public interface PostService {
    PostResponseDTO createPost(PostRequestDTO dto);
    List<PostResponseDTO> getAllPosts();
    PostResponseDTO getPostById(String id);
    PostResponseDTO updatePost(String id, PostRequestDTO dto);
    void deletePost(String id);
    List<PostResponseDTO> getPostsWithCommentCount();
    ReactionResponseDTO toggleReaction(String postId, String reactionType, String userId);
    List<PostResponseDTO> getPostsForYouPage();
}