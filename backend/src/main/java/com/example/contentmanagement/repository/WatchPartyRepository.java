package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.WatchParty;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WatchPartyRepository extends MongoRepository<WatchParty, String> {
}
