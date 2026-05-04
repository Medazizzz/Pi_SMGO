package com.example.contentmanagement.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class ReactionResponseDTO {
    private String postId;
    private Map<String, Integer> reactionCounts;
    private String userReaction;
    private int totalReactions;
    private boolean added;
}