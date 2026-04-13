import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feedback {
  id?: string;
  note: number;
  commentaire: string;
  watchPartyId: string;
  clientId: string;
  dateFeedback?: string;
  sentiment?: string;
  likes?: number;
  dislikes?: number;
  likedByUserIds?: string[];
  dislikedByUserIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private apiUrl = 'http://localhost:8090/feedback';

  constructor(private http: HttpClient) {}

  private getToken(): string {
    return localStorage.getItem('token')
      || localStorage.getItem('authToken')
      || '';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();

    console.log('TOKEN ENVOYÉ =', token);

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getByWatchParty(watchPartyId: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/watchparty/${watchPartyId}`, {
      headers: this.getAuthHeaders()
    });
  }

  addFeedback(data: { note: number; commentaire: string; watchPartyId: string }): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.apiUrl}/add`, data, {
      headers: this.getAuthHeaders()
    });
  }

  updateFeedback(id: string, data: { note: number; commentaire: string }): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  deleteFeedback(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  likeFeedback(id: string): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.apiUrl}/${id}/like`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  dislikeFeedback(id: string): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.apiUrl}/${id}/dislike`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}