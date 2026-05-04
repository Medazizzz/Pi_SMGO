package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.JoinRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JoinRequestRepository extends MongoRepository<JoinRequest, String> {
    List<JoinRequest> findByWatchPartyId(String watchPartyId);
    List<JoinRequest> findByWatchPartyIdAndStatus(String watchPartyId, String status);
    Optional<JoinRequest> findByWatchPartyIdAndUserId(String watchPartyId, String userId);
    void deleteByWatchPartyId(String watchPartyId);
}
