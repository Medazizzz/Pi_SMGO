package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.ToxicityLog;
import com.example.contentmanagement.entity.ToxicityLevel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ToxicityLogRepository extends MongoRepository<ToxicityLog, String> {

    // ✅ Keyword multi-champs — historique par auteur
    List<ToxicityLog> findByAuthorIdAndLevel(String authorId, ToxicityLevel level);

    // ✅ Keyword — count violations par auteur
    long countByAuthorIdAndLevelIn(String authorId, List<ToxicityLevel> levels);

    // ✅ Keyword — historique par target
    List<ToxicityLog> findByTargetIdAndTargetType(String targetId, String targetType);
}
