import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RenewalStatusDTO, RenewalAuditLog } from '../models/renewal.model';

@Injectable({ providedIn: 'root' })
export class RenewalService {

  private apiUrl = 'http://localhost:8090/api/renewal';

  constructor(private http: HttpClient) {}

  // ================================================================
  // ✅ Solution B — endpoints /me (JWT résolu côté backend)
  // Le header Authorization: Bearer <token> est injecté par l'intercepteur
  // ================================================================

  getMyRenewalStatus(): Observable<RenewalStatusDTO[]> {
    return this.http.get<RenewalStatusDTO[]>(`${this.apiUrl}/status/me`);
  }

  getMyAuditLog(): Observable<RenewalAuditLog[]> {
    return this.http.get<RenewalAuditLog[]>(`${this.apiUrl}/audit/me`);
  }

  cancelSubscription(abonnementId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel/${abonnementId}`, {});
  }

  // ================================================================
  // Endpoints avec userId explicite — conservés pour usage admin
  // ================================================================

  getRenewalStatus(userId: string): Observable<RenewalStatusDTO[]> {
    return this.http.get<RenewalStatusDTO[]>(`${this.apiUrl}/status/${userId}`);
  }

  getOneRenewalStatus(userId: string, abonnementId: string): Observable<RenewalStatusDTO> {
    return this.http.get<RenewalStatusDTO>(
      `${this.apiUrl}/status/${userId}/${abonnementId}`
    );
  }

  getAuditLog(userId: string): Observable<RenewalAuditLog[]> {
    return this.http.get<RenewalAuditLog[]>(`${this.apiUrl}/audit/${userId}`);
  }

  // ================================================================
  // Score — pas de userId requis, abonnementId suffit
  // ================================================================

  computeScore(abonnementId: string): Observable<RenewalStatusDTO> {
    return this.http.post<RenewalStatusDTO>(
      `${this.apiUrl}/compute-score/${abonnementId}`, {}
    );
  }

  // ================================================================
  // Helpers UI
  // ================================================================

  getScoreColor(score: number): string {
    if (score >= 80) return '#22c55e'; // vert   — fidèle, renouvellement auto
    if (score >= 50) return '#f59e0b'; // orange — offre de rétention
    if (score >= 20) return '#f97316'; // rouge-orange — risque suspension
    return '#ef4444';                  // rouge  — risque annulation
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:         'badge-success',
      PRE_RENEWAL:    'badge-info',
      RENEWING:       'badge-info',
      RENEWED:        'badge-success',
      FAILED_PAYMENT: 'badge-danger',
      GRACE_PERIOD:   'badge-warning',
      SUSPENDED:      'badge-danger',
      CANCELLED:      'badge-secondary'
    };
    return map[status] ?? 'badge-secondary';
  }
}