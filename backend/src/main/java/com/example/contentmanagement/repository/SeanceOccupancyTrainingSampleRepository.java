package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.SeanceOccupancyTrainingSample;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SeanceOccupancyTrainingSampleRepository extends MongoRepository<SeanceOccupancyTrainingSample, String> {
    Optional<SeanceOccupancyTrainingSample> findBySeanceId(String seanceId);
}
