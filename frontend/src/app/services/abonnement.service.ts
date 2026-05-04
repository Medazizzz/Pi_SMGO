import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Abonnement, AbonnementRequest } from '../models/abonnement.model';

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private readonly apiUrl = 'http://localhost:8090/api/abonnements';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(this.apiUrl);
  }

  getById(id: string): Observable<Abonnement> {
    return this.http.get<Abonnement>(`${this.apiUrl}/${id}`);
  }

  create(data: AbonnementRequest): Observable<Abonnement> {
    return this.http.post<Abonnement>(this.apiUrl, data);
  }

  update(id: string, data: AbonnementRequest): Observable<Abonnement> {
    return this.http.put<Abonnement>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
