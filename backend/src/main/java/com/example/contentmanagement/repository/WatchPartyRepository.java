package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.WatchParty;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface WatchPartyRepository extends MongoRepository<WatchParty, String> {

    @Query("{ 'statut': ?0 }")
    List<WatchParty> findByStatut(String statut);

    @Query("{ 'statut': ?0, 'dateCreation': { $lt: ?1 } }")
    List<WatchParty> findByStatutAndDateCreationBefore(String statut, Date date);

    @Query("{ 'clientId': ?0 }")
    List<WatchParty> findByClientId(String clientId);

    @Query("{ 'participantIds': ?0 }")
    List<WatchParty> findByParticipantIdsContaining(String userId);
}