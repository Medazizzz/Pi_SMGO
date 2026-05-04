package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Salle;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SalleRepository extends MongoRepository<Salle, String> {
}
