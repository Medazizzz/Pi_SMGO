export interface RenewalStatusDTO {
  abonnementId: string;
  userId: string;
  planType: string;
  prix: number;

  status: SubscriptionStatus;
  renewalScore: number;
  renewalDecision: string;
  renewalDecisionLabel: string;

  endDate: string;
  nextRenewalDate: string;
  lastRenewalDate: string;

  retryCount: number;
  retryNextDate: string;

  dunningJ30Sent: boolean;
  dunningJ15Sent: boolean;
  dunningJ7Sent: boolean;
  dunningJ1Sent: boolean;

  daysUntilExpiration: number;
  hasServiceAccess: boolean;
}

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PRE_RENEWAL'
  | 'RENEWING'
  | 'RENEWED'
  | 'FAILED_PAYMENT'
  | 'GRACE_PERIOD'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface RenewalAuditLog {
  id: string;
  userId: string;
  abonnementId: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  renewalScore: number;
  decision: string;
  details: string;
  timestamp: string;
}