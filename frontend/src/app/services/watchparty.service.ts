import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WatchPartySearchResult {
  watchPartyId: string;
  titre: string;
  statut: string;
  hostId: string;
  hostUsername: string;
  participantCount: number;
  feedbackCount: number;
  matchedFeedbackComment: string;
  matchedSentiment: string;
}

@Injectable({
  providedIn: 'root'
})
export class WatchpartyService {

  private apiUrl = 'http://localhost:8090/watchparty';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  add(data: { titre: string; contenuId: string }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/create`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  joinWatchParty(watchPartyId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/join`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  leaveWatchParty(watchPartyId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/leave`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  blockWatchParty(watchPartyId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getParticipants(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/participants`);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  addParticipant(watchPartyId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/add-participant?userId=${userId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  createJoinRequest(watchPartyId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/join-request`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getJoinRequests(watchPartyId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/${watchPartyId}/join-requests`,
      { headers: this.getAuthHeaders() }
    );
  }

  approveJoinRequest(watchPartyId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/approve-join?userId=${userId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  rejectJoinRequest(watchPartyId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchPartyId}/reject-join?userId=${userId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  searchWatchParties(keyword: string): Observable<WatchPartySearchResult[]> {
    return this.http.get<WatchPartySearchResult[]>(
      `${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`,
      { headers: this.getAuthHeaders() }
    );
  }
}