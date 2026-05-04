package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Documentary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentaryRepository extends MongoRepository<Documentary, String> {
}
