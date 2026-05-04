package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Content;
import com.example.contentmanagement.entity.ContentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ContentRepository extends MongoRepository<Content, String>, ContentRepositoryCustom {
	List<Content> findByStatusAndPublishAtLessThanEqual(ContentStatus status, LocalDateTime dateTime);

	List<Content> findByStatusAndExpireAtLessThanEqual(ContentStatus status, LocalDateTime dateTime);
}
