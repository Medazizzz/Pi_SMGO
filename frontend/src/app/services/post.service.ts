import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReactionResponse {
  postId: string;
  reactionCounts: Record<string, number>;
  userReaction: string | null;
  totalReactions: number;
  added: boolean;
}

export interface Post {
  id?: string;
  titre: string;
  contenu: string;
  datePublication?: string;
  authorUsername?: string;
  commentCount?: number;
  imageUrl?: string;
  vues?: number;
  reactionCounts?: Record<string, number>; // ✅ { "LIKE": 3, "LOVE": 1 }
  userReaction?: string | null;            // ✅ réaction de l'utilisateur connecté
  toxicityLevel?: string;
  hidden?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PostService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8090/api/posts';

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  createPost(post: Omit<Post, 'id' | 'datePublication' | 'authorUsername'>): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, post);
  }

  updatePost(id: string, post: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPostsWithStats(): Observable<Post[]> {
  return this.http.get<Post[]>(`${this.apiUrl}/with-stats`);
}

  // ✅ Toggle réaction
  toggleReaction(postId: string, reactionType: string): Observable<ReactionResponse> {
    return this.http.post<ReactionResponse>(
      `${this.apiUrl}/${postId}/reactions`,
      { reactionType }
    );
  }
  // ✅ For You Page
  getPostsForYouPage(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/for-you`);
}
}