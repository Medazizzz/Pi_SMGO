package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Feedback;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FeedbackRepository extends MongoRepository<Feedback, String> {
	List<Feedback> findByWatchPartyId(String watchPartyId);
}
