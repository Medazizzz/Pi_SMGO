import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Crown, Star, CreditCard } from 'lucide-angular';
import { AbonnementService } from '../../services/abonnement.service';
import { Abonnement } from '../../models/abonnement.model';
import { AuthService } from '../../services/auth.service';
import { RecommendationService } from '../../services/recommendation.service';
import { RecommendationResult } from '../../models/recommendation.model';

@Component({
  selector: 'app-user-abonnement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-abonnement.component.html'
})
export class UserAbonnementComponent implements OnInit {

  readonly CrownIcon      = Crown;
  readonly StarIcon       = Star;
  readonly CreditCardIcon = CreditCard;

  abonnements:    Abonnement[]                = [];
  recommendation: RecommendationResult | null = null;
  loading         = false;
  loadingRec      = false;
  errorMessage    = '';
  errorRec        = '';
  showModal       = false;

  constructor(
    private service:               AbonnementService,
    private router:                Router,
    private authService:           AuthService,
    private recommendationService: RecommendationService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next:  (data) => { this.abonnements = data; this.loading = false; },
      error: ()     => { this.errorMessage = 'Unable to load plans.'; this.loading = false; }
    });
  }

  isPremium(a: Abonnement): boolean {
    return a.type === 'PREMIUM';
  }

  choosePlan(a: Abonnement): void {
    localStorage.setItem('selectedAbonnement', JSON.stringify(a));
    this.router.navigate(['/user/payment', a.id], {
      state: { abonnement: a }
    });
  }

  // ✅ Navigation vers la page renewal
  goToRenewal(): void {
    this.router.navigate(['/user/renewal']);
  }

  openRecommendation(): void {
    this.showModal  = true;
    this.loadingRec = true;
    this.errorRec   = '';

    const userId = this.authService.getCurrentUserId();
    if (!userId) { this.loadingRec = false; return; }

    this.recommendationService.getRecommendation(userId).subscribe({
      next:  (data) => { this.recommendation = data; this.loadingRec = false; },
      error: ()     => { this.errorRec = 'Unable to load recommendation.'; this.loadingRec = false; }
    });
  }

  closeRecommendation(): void {
    this.showModal = false;
  }

  choosePlanByType(type: string): void {
    const plan = this.abonnements.find(a => a.type === type);
    if (plan) {
      this.closeRecommendation();
      this.choosePlan(plan);
    }
  }

  getBadgeColor(): string {
    switch (this.recommendation?.recommande) {
      case 'ELITE':   return '#FFD700';
      case 'PREMIUM': return '#C0C0C0';
      default:        return '#CD7F32';
    }
  }

  getBadgeIcon(): string {
    switch (this.recommendation?.recommande) {
      case 'ELITE':   return '👑';
      case 'PREMIUM': return '⭐';
      default:        return '🔵';
    }
  }
}