import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PromotionService, Promotion, EngagementResult } from '../../../services/promotion.service';
import { PromoCartService } from '../../../services/promo-cart.service';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './promotions.component.html'
})
export class PromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  promotionForm: FormGroup;
  editingId: string | null = null;
  isAdmin = false;
  searchCode = '';
  foundPromotion: Promotion | null = null;
  searchError = '';
  personalizedPromo: Promotion | null = null;
  engagementResult: EngagementResult | null = null;
  loadingPersonalized = false;
  

  constructor(
    private promotionService: PromotionService,
    private fb: FormBuilder,
    private router: Router,
    private promoCartService: PromoCartService
  ) {
    const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
    this.isAdmin = userRole.includes('ADMIN');

    this.promotionForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      pourcentageReduction: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      dateExpiration: ['', Validators.required],
      clientId: ['']
    });
  }

  ngOnInit() {
    this.loadPromotions();
    if (!this.isAdmin) this.loadEngagement();
  }

  loadPromotions() {
    const call = this.isAdmin ? this.promotionService.getAll() : this.promotionService.getActive();
    call.subscribe(data => this.promotions = data);
  }

  loadEngagement() {
    this.promotionService.getEngagementScore().subscribe({
      next: result => this.engagementResult = result,
      error: () => {}
    });
  }

  generatePersonalized() {
    this.loadingPersonalized = true;
    this.promotionService.generatePersonalizedPromotion().subscribe({
      next: promo => { this.personalizedPromo = promo; this.loadingPersonalized = false; },
      error: () => this.loadingPersonalized = false
    });
  }

  reserveWithPromo() {
  if (this.personalizedPromo) {
    this.promoCartService.setPromo(this.personalizedPromo);
    this.router.navigate(['/user/cinema'], { queryParams: { module: 'sessions' } });
  }
}

  // ✅ Basé sur score, pas sur label
  getScore(): number {
    return this.engagementResult?.totalScore ?? 0;
  }

  getLevelEmoji(): string {
    const s = this.getScore();
    if (s >= 51) return '💎';
    if (s >= 31) return '🥇';
    if (s >= 11) return '🥈';
    return '🥉';
  }

  getLevelLabel(): string {
    const s = this.getScore();
    if (s >= 51) return 'Diamond';
    if (s >= 31) return 'Gold';
    if (s >= 11) return 'Silver';
    return 'Bronze';
  }

  getLevelColor(): string {
    const s = this.getScore();
    if (s >= 51) return 'text-cyan-400';
    if (s >= 31) return 'text-yellow-400';
    if (s >= 11) return 'text-gray-300';
    return 'text-amber-500';
  }

  getLevelGradient(): string {
    const s = this.getScore();
    if (s >= 51) return 'linear-gradient(to right, #06b6d4, #67e8f9)';
    if (s >= 31) return 'linear-gradient(to right, #eab308, #fde047)';
    if (s >= 11) return 'linear-gradient(to right, #9ca3af, #e5e7eb)';
    return 'linear-gradient(to right, #d97706, #fbbf24)';
  }

  getLevelBadgeClass(): string {
    const s = this.getScore();
    if (s >= 51) return 'bg-cyan-900/20 border-cyan-500/40 text-cyan-400';
    if (s >= 31) return 'bg-yellow-900/20 border-yellow-500/40 text-yellow-400';
    if (s >= 11) return 'bg-gray-800/40 border-gray-500/40 text-gray-300';
    return 'bg-amber-900/20 border-amber-600/40 text-amber-400';
  }

  getLevelBarClass(): string {
    const s = this.getScore();
    if (s >= 51) return 'bg-cyan-400';
    if (s >= 31) return 'bg-yellow-400';
    if (s >= 11) return 'bg-gray-400';
    return 'bg-amber-500';
  }

  getDiscountPercent(): number {
    const s = this.getScore();
    if (s >= 51) return 20;
    if (s >= 31) return 15;
    if (s >= 11) return 10;
    return 5;
  }

  onSubmit() {
    if (this.promotionForm.invalid) return;
    const payload = {
      ...this.promotionForm.value,
      dateExpiration: new Date(this.promotionForm.value.dateExpiration).toISOString()
    };
    if (this.editingId) {
      this.promotionService.update(this.editingId, payload).subscribe(() => {
        this.loadPromotions(); this.resetForm();
      });
      return;
    }
    this.promotionService.create(payload).subscribe(() => {
      this.loadPromotions(); this.resetForm();
    });
  }

  editPromotion(p: Promotion) {
    this.editingId = p.id!;
    this.promotionForm.patchValue({
      code: p.code,
      pourcentageReduction: p.pourcentageReduction,
      dateExpiration: p.dateExpiration?.substring(0, 10),
      clientId: p.clientId || ''
    });
  }

  deactivate(id: string) {
    this.promotionService.deactivate(id).subscribe(() => this.loadPromotions());
  }

  delete(id: string) {
    if (confirm('Delete this promotion?')) {
      this.promotionService.delete(id).subscribe(() => this.loadPromotions());
    }
  }

  searchByCode() {
    if (!this.searchCode.trim()) return;
    this.searchError = '';
    this.foundPromotion = null;
    this.promotionService.getByCode(this.searchCode.trim()).subscribe({
      next: p => this.foundPromotion = p,
      error: () => this.searchError = 'Promo code not found.'
    });
  }

  resetForm() {
    this.editingId = null;
    this.promotionForm.reset();
  }


}