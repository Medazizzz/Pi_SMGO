package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.NewsletterCampaign;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NewsletterCampaignRepository extends MongoRepository<NewsletterCampaign, String> {
    List<NewsletterCampaign> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime scheduledAt);
}
