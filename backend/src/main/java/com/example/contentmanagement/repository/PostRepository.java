package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostRepository extends MongoRepository<Post, String> {
}
