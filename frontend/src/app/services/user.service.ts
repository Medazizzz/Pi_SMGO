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
  fidelityScore?: number;
  fidelityLevel?: string;
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

  /**
   * Send a one-off test email to the specified address using the backend test endpoint.
   */
  sendTestEmail(email: string, subject?: string, body?: string): Observable<string> {
    const payload = { email, subject: subject || 'SMGO Test Email', body: body || 'This is a test email from SMGO.' };
    return this.http.post(`${this.apiUrl.replace('/users', '')}/notifications/test/send-email`, payload, { responseType: 'text' });
  }
  getUsers() {
  return this.http.get("http://localhost:8090/api/users");
}
}
