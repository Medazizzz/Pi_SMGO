package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {
}
