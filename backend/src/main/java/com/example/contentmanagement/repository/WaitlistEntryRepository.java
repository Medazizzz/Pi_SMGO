package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.WaitlistEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WaitlistEntryRepository extends MongoRepository<WaitlistEntry, String> {
    List<WaitlistEntry> findBySeanceIdAndActiveTrueOrderByCreatedAtAsc(String seanceId);
    boolean existsBySeanceIdAndUserIdAndActiveTrue(String seanceId, String userId);
    boolean existsBySeanceIdAndEmailAndActiveTrue(String seanceId, String email);
    Optional<WaitlistEntry> findFirstBySeanceIdAndUserIdAndActiveTrue(String seanceId, String userId);
    Optional<WaitlistEntry> findFirstBySeanceIdAndEmailAndActiveTrue(String seanceId, String email);
}
