import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Promotion } from './promotion.service';

@Injectable({ providedIn: 'root' })
export class PromoCartService {

  // ✅ Stocke la promo active en mémoire — pattern Observer
  private promoSubject = new BehaviorSubject<Promotion | null>(null);
  promo$ = this.promoSubject.asObservable();

  setPromo(promo: Promotion) {
    this.promoSubject.next(promo);
  }

  clearPromo() {
    this.promoSubject.next(null);
  }

  getPromo(): Promotion | null {
    return this.promoSubject.getValue();
  }

  // ✅ Calcule le prix final après réduction
  calculateFinalPrice(originalPrice: number): number {
    const promo = this.promoSubject.getValue();
    if (!promo || !promo.active) return originalPrice;
    const reduction = (originalPrice * promo.pourcentageReduction) / 100;
    return Math.round((originalPrice - reduction) * 100) / 100;
  }
}