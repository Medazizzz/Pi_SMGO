package com.example.contentmanagement.repository;

import com.example.contentmanagement.entity.RenewalAuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RenewalAuditLogRepository extends MongoRepository<RenewalAuditLog, String> {

    List<RenewalAuditLog> findByUserIdOrderByTimestampDesc(String userId);

    List<RenewalAuditLog> findByAbonnementIdOrderByTimestampDesc(String abonnementId);
}