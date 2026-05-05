import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FidelityDiscountDTO {
  userId: string;
  currentFidelityScore: number;
  abonnementId: string;
  planType: string;
  originalPrice: number;
  pointsToUse: number;
  discountAmount: number;
  finalPrice: number;
  remainingPoints: number;
  maxUsablePoints: number;
  maxDiscountAmount: number;
  conversionRate: number;
  applied: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FidelityDiscountService {

  private apiUrl = 'http://localhost:8090/api/fidelity-discount';

  constructor(private http: HttpClient) {}

  getInfo(userId: string, abonnementId: string): Observable<FidelityDiscountDTO> {
    return this.http.get<FidelityDiscountDTO>(
      `${this.apiUrl}/info/${userId}/${abonnementId}`
    );
  }

  simulate(userId: string, abonnementId: string, points: number): Observable<FidelityDiscountDTO> {
    return this.http.post<FidelityDiscountDTO>(
      `${this.apiUrl}/simulate?userId=${userId}&abonnementId=${abonnementId}&pointsToUse=${points}`, {}
    );
  }

  apply(userId: string, abonnementId: string, points: number): Observable<FidelityDiscountDTO> {
    return this.http.post<FidelityDiscountDTO>(
      `${this.apiUrl}/apply?userId=${userId}&abonnementId=${abonnementId}&pointsToUse=${points}`, {}
    );
  }
}