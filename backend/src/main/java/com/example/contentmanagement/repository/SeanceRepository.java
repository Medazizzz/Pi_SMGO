package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Seance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SeanceRepository extends MongoRepository<Seance, String> {
    List<Seance> findByCinemaId(String cinemaId);
}
