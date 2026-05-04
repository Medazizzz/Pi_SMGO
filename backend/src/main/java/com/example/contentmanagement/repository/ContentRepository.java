package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Content;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContentRepository extends MongoRepository<Content, String> {
}
