import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse } from '../models/payment.model';

export interface DiscountInfo {
  discountApplied: boolean;
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = 'http://localhost:8090/api/payments';

  constructor(private http: HttpClient) {}

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
  }

  // 🆕 Lire les infos de remise stockées par fidelity-discount
  getDiscountInfo(): DiscountInfo {
    return {
      discountApplied: localStorage.getItem('discountApplied') === 'true',
      originalPrice: parseFloat(localStorage.getItem('originalPrice') || '0'),
      discountAmount: parseFloat(localStorage.getItem('discountAmount') || '0'),
      discountedPrice: parseFloat(localStorage.getItem('discountedPrice') || '0'),
    };
  }

  // 🆕 Prix final à utiliser pour le paiement
  getFinalPrice(): number {
    const info = this.getDiscountInfo();
    return info.discountApplied && info.discountedPrice > 0
      ? info.discountedPrice
      : info.originalPrice;
  }

  // 🆕 Nettoyer localStorage après paiement réussi
  clearDiscountInfo(): void {
    localStorage.removeItem('discountApplied');
    localStorage.removeItem('originalPrice');
    localStorage.removeItem('discountAmount');
    localStorage.removeItem('discountedPrice');
  }
}