package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.SeanceOccupancyTemporalSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SeanceOccupancyTemporalSnapshotRepository extends MongoRepository<SeanceOccupancyTemporalSnapshot, String> {
}
