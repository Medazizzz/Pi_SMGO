package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Fidelity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FidelityRepository extends MongoRepository<Fidelity, String> {
}
