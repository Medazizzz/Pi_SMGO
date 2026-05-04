package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Commentaire;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentaireRepository extends MongoRepository<Commentaire, String> {
    List<Commentaire> findByPostId(String postId);
    void deleteByPostId(String postId);
}
