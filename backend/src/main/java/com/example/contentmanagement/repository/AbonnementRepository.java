package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Abonnement;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AbonnementRepository extends MongoRepository<Abonnement, String> {
}
