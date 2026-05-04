package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Salle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SalleRepository extends MongoRepository<Salle, String> {
	Optional<Salle> findByNameIgnoreCase(String name);
}
