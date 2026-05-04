import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fidelity, FidelityRequest } from '../models/fidelity.model';

@Injectable({ providedIn: 'root' })
export class FidelityService {
  private readonly apiUrl = 'http://localhost:8090/api/fidelities';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Fidelity[]> {
    return this.http.get<Fidelity[]>(this.apiUrl);
  }

  getById(id: string): Observable<Fidelity> {
    return this.http.get<Fidelity>(`${this.apiUrl}/${id}`);
  }

  create(data: FidelityRequest): Observable<Fidelity> {
    return this.http.post<Fidelity>(this.apiUrl, data);
  }

  update(id: string, data: FidelityRequest): Observable<Fidelity> {
    return this.http.put<Fidelity>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
