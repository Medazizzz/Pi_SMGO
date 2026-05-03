package com.example.contentmanagement.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nonapi.io.github.classgraph.json.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "renewal_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenewalAuditLog {

    @Id
    private String id;

    private String userId;
    private String abonnementId;
    private String action;          // ex: "EMAIL_J30_SENT", "PAYMENT_RETRY", "STATUS_CHANGED"
    private String previousStatus;
    private String newStatus;
    private double renewalScore;
    private String decision;
    private String details;         // message libre
    private LocalDateTime timestamp;
}