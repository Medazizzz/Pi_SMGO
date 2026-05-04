import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private apiUrl = 'http://localhost:8090/feedback';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getByWatchParty(watchPartyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/watchparty/${watchPartyId}`);
  }

  addFeedback(data: { note: number; commentaire: string; watchPartyId: string; clientId?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, data);
  }

  updateFeedback(id: string, data: { note: number; commentaire: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteFeedback(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  likeFeedback(id: string, userId?: string): Observable<any> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.http.post<any>(`${this.apiUrl}/${id}/like${query}`, {});
  }

  dislikeFeedback(id: string, userId?: string): Observable<any> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.http.post<any>(`${this.apiUrl}/${id}/dislike${query}`, {});
  }
}
