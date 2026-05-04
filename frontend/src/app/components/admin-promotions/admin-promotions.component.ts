import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, Promotion } from '../../services/promotion.service';

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-promotions.component.html'
})
export class AdminPromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  showForm = false;
  promoForm: FormGroup;
  editingId: string | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  // ✅ Fraud Detection
  fraudResults: Map<string, any> = new Map();
  analyzingId: string | null = null;
  analyzingAll = false;
  fraudStats = { total: 0, fraud: 0, suspicious: 0, safe: 0 };

  constructor(
    private promotionService: PromotionService,
    private fb: FormBuilder
  ) {
    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      pourcentageReduction: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      dateExpiration: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.loading = true;
    this.promotionService.getAll().subscribe({
      next: (data) => { this.promotions = data; this.loading = false; },
      error: () => { this.errorMessage = 'Unable to load promotions.'; this.loading = false; }
    });
  }

  get totalPromos(): number { return this.promotions.length; }
  get activePromos(): number { return this.promotions.filter(p => p.active).length; }

  // ✅ Analyser une promo
  analyzeOne(promoId: string): void {
    this.analyzingId = promoId;
    this.promotionService.analyzeOneFraud(promoId).subscribe({
      next: (result) => {
        this.fraudResults.set(promoId, result);
        this.analyzingId = null;
        if (!result.isFraud || result.alertLevel === 'SAFE') {
          // Reload si promo désactivée
          this.loadPromotions();
        }
      },
      error: () => this.analyzingId = null
    });
  }

  // ✅ Analyser toutes les promos
  analyzeAll(): void {
    this.analyzingAll = true;
    this.fraudResults.clear();
    this.promotionService.analyzeAllFraud().subscribe({
      next: (results) => {
        results.forEach(r => {
          if (r.promoId) this.fraudResults.set(r.promoId, r);
        });
        this.updateFraudStats();
        this.analyzingAll = false;
        this.loadPromotions();
      },
      error: () => this.analyzingAll = false
    });
  }

  updateFraudStats(): void {
    const values = Array.from(this.fraudResults.values());
    this.fraudStats = {
      total: values.length,
      fraud: values.filter(r => r.alertLevel === 'FRAUD' || r.alertLevel === 'CRITICAL_FRAUD').length,
      suspicious: values.filter(r => r.alertLevel === 'SUSPICIOUS').length,
      safe: values.filter(r => r.alertLevel === 'SAFE').length
    };
  }

  getFraudResult(promoId: string): any {
    return this.fraudResults.get(promoId);
  }

  getFraudBadgeClass(alertLevel: string): string {
    switch (alertLevel) {
      case 'SAFE': return 'bg-green-900/30 text-green-400';
      case 'SUSPICIOUS': return 'bg-amber-900/30 text-amber-400';
      case 'FRAUD': return 'bg-orange-900/30 text-orange-400';
      case 'CRITICAL_FRAUD': return 'bg-red-900/30 text-red-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  }

  getFraudEmoji(alertLevel: string): string {
    switch (alertLevel) {
      case 'SAFE': return '✅';
      case 'SUSPICIOUS': return '⚠️';
      case 'FRAUD': return '🚨';
      case 'CRITICAL_FRAUD': return '🔴';
      default: return '';
    }
  }

  onSubmit(): void {
    if (this.promoForm.invalid) return;
    this.loading = true;
    const isUpdate = !!this.editingId;
    const payload = {
      ...this.promoForm.value,
      active: true,
      dateExpiration: new Date(this.promoForm.value.dateExpiration).toISOString()
    };
    const request$ = this.editingId
      ? this.promotionService.update(this.editingId, payload)
      : this.promotionService.create(payload);
    request$.subscribe({
      next: () => {
        this.loadPromotions();
        this.promoForm.reset();
        this.showForm = false;
        this.editingId = null;
        this.loading = false;
        this.successMessage = isUpdate ? 'Promotion updated.' : 'Promotion created.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Unable to save promotion.'; this.loading = false; }
    });
  }

  editPromotion(promo: Promotion): void {
    this.editingId = promo.id || null;
    this.showForm = true;
    this.promoForm.patchValue({
      code: promo.code,
      pourcentageReduction: promo.pourcentageReduction,
      dateExpiration: promo.dateExpiration?.substring(0, 10)
    });
  }

  deactivate(id: string): void {
    this.promotionService.deactivate(id).subscribe(() => this.loadPromotions());
  }

  delete(id: string): void {
    if (confirm('Delete this promotion?')) {
      this.promotionService.delete(id).subscribe(() => this.loadPromotions());
    }
  }
}