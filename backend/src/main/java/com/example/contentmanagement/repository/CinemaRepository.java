package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Cinema;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CinemaRepository extends MongoRepository<Cinema, String> {
}
