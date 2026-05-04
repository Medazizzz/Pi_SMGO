package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Film;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FilmRepository extends MongoRepository<Film, String> {
}
