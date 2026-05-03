import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecommendationResult } from '../models/recommendation.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {

  private apiUrl = 'http://localhost:8090/api/recommendations';

  constructor(private http: HttpClient) {}

  getRecommendation(userId: string): Observable<RecommendationResult> {
    return this.http.get<RecommendationResult>(`${this.apiUrl}/${userId}`);
  }
}