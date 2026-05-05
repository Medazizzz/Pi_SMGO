import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FidelityDiscountService, FidelityDiscountDTO } from '../../services/fidelity-discount.service';

@Component({
  selector: 'app-fidelity-discount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fidelity-discount.component.html',
  styleUrls: ['./fidelity-discount.component.css']
})
export class FidelityDiscountComponent implements OnInit {

  info: FidelityDiscountDTO | null = null;
  simulation: FidelityDiscountDTO | null = null;
  result: FidelityDiscountDTO | null = null;

  pointsToUse: number = 0;
  loading = true;
  applying = false;
  successMessage = '';
  errorMessage = '';

  private userId = '';
  private abonnementId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private discountService: FidelityDiscountService
  ) {}

  ngOnInit(): void {
    this.abonnementId = this.route.snapshot.paramMap.get('abonnementId') || '';
    this.userId = this.getUserIdFromToken();

    if (!this.userId) {
      this.errorMessage = 'Utilisateur non connecté.';
      this.loading = false;
      return;
    }

    this.loadInfo();
  }

  private getUserIdFromToken(): string {
    try {
      const token = localStorage.getItem('token')
                 || localStorage.getItem('authToken')
                 || localStorage.getItem('access_token');
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload.sub || '';
    } catch { return ''; }
  }

  loadInfo(): void {
    this.loading = true;
    this.discountService.getInfo(this.userId, this.abonnementId).subscribe({
      next: (data) => {
        this.info = data;
        this.pointsToUse = 0;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les informations.';
        this.loading = false;
      }
    });
  }

  onSliderChange(): void {
    if (this.pointsToUse < 100) {
      this.simulation = null;
      return;
    }
    this.discountService.simulate(this.userId, this.abonnementId, this.pointsToUse)
      .subscribe({ next: (data) => this.simulation = data });
  }

  applyDiscount(): void {
    if (!this.simulation || this.pointsToUse < 100) return;
    this.applying = true;
    this.discountService.apply(this.userId, this.abonnementId, this.pointsToUse).subscribe({
      next: (data) => {
        this.result = data;
        this.successMessage = data.message;
        this.applying = false;
        this.loadInfo();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'application de la remise.';
        this.applying = false;
      }
    });
  }

  // ✅ Naviguer vers le paiement avec le prix réduit
  payWithDiscount(): void {
    if (!this.result) return;

    localStorage.setItem('discountedPrice',  this.result.finalPrice.toString());
    localStorage.setItem('discountAmount',   this.result.discountAmount.toString());
    localStorage.setItem('originalPrice',    this.result.originalPrice.toString());
    localStorage.setItem('discountApplied',  'true');

    this.router.navigate(['/user/payment', this.abonnementId]);
  }

  get discountPercent(): number {
    if (!this.info || !this.simulation) return 0;
    return Math.round((this.simulation.discountAmount / this.info.originalPrice) * 100);
  }

  get sliderMax(): number {
    return this.info?.maxUsablePoints ?? 0;
  }
}