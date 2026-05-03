import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SeanceRequest {
  salle_capacity: number;
  seats_reserved: number;
  heure_num: number;
  day_of_week_num: number;
  is_weekend: number;
  is_holiday: number;
  is_school_vacation: number;
  is_before_holiday: number;
  month: number;
  avg_taux_cinema: number;
  avg_taux_salle: number;
  avg_taux_creneau: number;
  avg_taux_contenu: number;
  history_cinema: number;
  history_salle: number;
}

export interface PredictionResponse {
  prediction: string;
  confiance: number;
  action: string;
  detail: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private readonly apiUrl = 'http://localhost:8090/api/seances/predict';

  constructor(private readonly http: HttpClient) {}

  predict(request: SeanceRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(this.apiUrl, request);
  }
}
