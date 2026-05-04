import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Promotion {
  id?: string;
  code: string;
  pourcentageReduction: number;
  dateExpiration: string;
  clientId?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8090/api/promotions';

  getActive(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  getAll(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/all`);
  }

  getByCode(code: string): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/code/${code}`);
  }

  create(p: Omit<Promotion, 'id' | 'active'>): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, p);
  }

  update(id: string, p: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/${id}`, p);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
