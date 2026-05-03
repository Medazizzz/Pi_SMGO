package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.SubscriptionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AbonnementRepository extends MongoRepository<Abonnement, String> {

    // ✅ existant
    List<Abonnement> findByUserId(String userId);

    // ✅ manquait — utilisé par RenewalScheduler step1 et step3
    List<Abonnement> findByStatus(SubscriptionStatus status);

    // ✅ utilisé par step2 et step4
    List<Abonnement> findByStatusAndEndDateBetween(
            SubscriptionStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    // ✅ utilisé par PaymentRetryOrchestrator
    List<Abonnement> findByStatusAndRetryNextDateBefore(
            SubscriptionStatus status,
            LocalDateTime now
    );

    // ✅ utilisé par PaymentRetryOrchestrator (grace period + suspension)
    List<Abonnement> findByStatusAndEndDateBefore(
            SubscriptionStatus status,
            LocalDateTime now
    );
}