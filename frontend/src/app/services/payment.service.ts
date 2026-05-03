import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = 'http://localhost:8090/api/payments';

  constructor(private http: HttpClient) {}

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
  }
}