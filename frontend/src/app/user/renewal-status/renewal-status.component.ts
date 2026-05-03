import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RenewalService } from '../../services/renewal.service';
import { RenewalStatusDTO, RenewalAuditLog } from '../../models/renewal.model';

@Component({
  selector: 'app-renewal-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './renewal-status.component.html',
  styleUrls: ['./renewal-status.component.css']
})
export class RenewalStatusComponent implements OnInit {

  renewals: RenewalStatusDTO[] = [];
  auditLogs: RenewalAuditLog[] = [];
  selectedRenewal: RenewalStatusDTO | null = null;
  loading = true;
  loadingAudit = false;
  errorMessage = '';

  private username: string = '';

  constructor(
    public renewalService: RenewalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.getUsernameFromToken();
    if (!this.username) {
      this.router.navigate(['/auth/login']); // ✅ corrigé : était '/login'
      return;
    }
    this.loadRenewalStatus();
  }

  private getUsernameFromToken(): string {
    try {
      const token = localStorage.getItem('token')
                 || localStorage.getItem('authToken')
                 || localStorage.getItem('access_token');
      if (!token) return '';
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.sub || decoded.username || decoded.email || '';
    } catch (e) {
      console.error('Erreur décodage token JWT:', e);
      return '';
    }
  }

  loadRenewalStatus(): void {
    this.loading = true;
    this.renewalService.getMyRenewalStatus().subscribe({
      next: (data) => {
        this.renewals = data;
        this.loading = false;
        if (data.length > 0) {
          this.selectedRenewal = data[0];
          this.loadAuditLog();
        }
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des abonnements.';
        this.loading = false;
      }
    });
  }

  loadAuditLog(): void {
    this.loadingAudit = true;
    this.renewalService.getMyAuditLog().subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.loadingAudit = false;
      },
      error: () => { this.loadingAudit = false; }
    });
  }

  selectRenewal(renewal: RenewalStatusDTO): void {
    this.selectedRenewal = renewal;
  }

  computeScore(abonnementId: string): void {
    this.renewalService.computeScore(abonnementId).subscribe({
      next: (updated) => {
        const index = this.renewals.findIndex(r => r.abonnementId === abonnementId);
        if (index !== -1) this.renewals[index] = updated;
        this.selectedRenewal = updated;
      }
    });
  }

  cancelSubscription(abonnementId: string): void {
    if (!confirm('Confirmer l\'annulation ?')) return;
    this.renewalService.cancelSubscription(abonnementId).subscribe({
      next: () => this.loadRenewalStatus()
    });
  }

  getScoreWidth(score: number): string { return score + '%'; }
  getScoreColor(score: number): string { return this.renewalService.getScoreColor(score); }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:         'status-active',
      PRE_RENEWAL:    'status-pre',
      RENEWING:       'status-pre',
      RENEWED:        'status-active',
      FAILED_PAYMENT: 'status-danger',
      GRACE_PERIOD:   'status-warning',
      SUSPENDED:      'status-danger',
      CANCELLED:      'status-cancelled'
    };
    return map[status] ?? 'status-cancelled';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}