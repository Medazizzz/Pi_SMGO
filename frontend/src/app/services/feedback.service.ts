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
  audioUrl?: string;
  likes?: number;
  dislikes?: number;
  likedByUserIds?: string[];
  dislikedByUserIds?: string[];
  emojiCounts?: { [key: string]: number };
  emojiUserReactions?: { [key: string]: string };
}

export interface CommentCorrectionResponse {
  originalText: string;
  correctedText: string;
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

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersWithoutContentType(): HttpHeaders {
    const token = this.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
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

  addFeedback(data: {
    note: number;
    commentaire: string;
    watchPartyId: string;
  }): Observable<Feedback> {
    return this.http.post<Feedback>(`${this.apiUrl}/add`, data, {
      headers: this.getAuthHeaders()
    });
  }

  addFeedbackWithAudio(data: {
    note: number;
    commentaire?: string;
    watchPartyId: string;
    audioFile?: File | null;
  }): Observable<Feedback> {
    const formData = new FormData();

    formData.append('note', String(data.note));
    formData.append('watchPartyId', data.watchPartyId);

    if (data.commentaire && data.commentaire.trim() !== '') {
      formData.append('commentaire', data.commentaire.trim());
    }

    if (data.audioFile) {
      formData.append('audioFile', data.audioFile);
    }

    return this.http.post<Feedback>(`${this.apiUrl}/add-with-audio`, formData, {
      headers: this.getAuthHeadersWithoutContentType()
    });
  }

  updateFeedback(id: string, data: {
    note: number;
    commentaire: string;
  }): Observable<Feedback> {
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

  correctComment(text: string): Observable<CommentCorrectionResponse> {
    return this.http.post<CommentCorrectionResponse>(
      `${this.apiUrl}/correct`,
      { text },
      {
        headers: this.getAuthHeaders()
      }
    );
  }
}