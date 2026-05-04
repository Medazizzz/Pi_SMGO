import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role?: string;
  createdAt?: string;
  blocked?: boolean;
  photoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8090/api/users';

  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  updateUser(id: string, data: Partial<UserDTO>): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMyProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/me`);
  }

  updateMyProfile(data: { username?: string; email?: string; photoUrl?: string }): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/me`, data);
  }
}
