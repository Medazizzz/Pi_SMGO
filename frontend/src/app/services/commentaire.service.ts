import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Commentaire {
  id?: string;
  contenu: string;
  postId: string;
  authorUsername?: string;
  dateCommentaire?: string;
}

@Injectable({ providedIn: 'root' })
export class CommentaireService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8090/api/commentaires';

  getByPostId(postId: string): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiUrl}/post/${postId}`);
  }

  create(commentaire: { contenu: string; postId: string }): Observable<Commentaire> {
    return this.http.post<Commentaire>(this.apiUrl, commentaire);
  }

  update(id: string, commentaire: { contenu: string; postId: string }): Observable<Commentaire> {
    return this.http.put<Commentaire>(`${this.apiUrl}/${id}`, commentaire);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
