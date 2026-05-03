package com.example.contentmanagement.entity;
public enum SubscriptionStatus {
    ACTIVE,           // Abonnement actif normal
    PRE_RENEWAL,      // Dans la fenêtre J-30 (bientôt à renouveler)
    RENEWING,         // En cours de traitement de renouvellement
    RENEWED,          // Renouvelé avec succès
    FAILED_PAYMENT,   // Paiement échoué
    GRACE_PERIOD,     // Période de grâce (service encore actif)
    SUSPENDED,        // Service suspendu
    CANCELLED         // Annulé définitivement
}