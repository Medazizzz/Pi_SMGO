package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {

    // ✅ Keyword multi-champs — tâche 3 du cours
    List<Reaction> findByTargetIdAndTargetType(String targetId, String targetType);

    Optional<Reaction> findByTargetIdAndTargetTypeAndUserId(
            String targetId, String targetType, String userId);

    void deleteByTargetIdAndTargetTypeAndUserId(
            String targetId, String targetType, String userId);

    // ✅ Pour les stats
    long countByTargetIdAndTargetTypeAndReactionType(
            String targetId, String targetType, String reactionType);
}