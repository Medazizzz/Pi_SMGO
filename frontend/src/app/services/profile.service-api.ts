import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile, CreateProfileRequest } from '../models/profile.model';

/**
 * Profile Service - Backend Integration
 * WHY: Manage user profiles with API integration
 * Handles all profile CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = 'http://localhost:8080/api/profiles';

  constructor(private http: HttpClient) {}

  /**
   * Get all profiles for a user
   * API: GET /api/profiles/user/{userId}
   */
  getUserProfiles(userId: string): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Get single profile by ID
   * API: GET /api/profiles/{profileId}
   */
  getProfileById(profileId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${profileId}`);
  }

  /**
   * Get default profile for user
   * API: GET /api/profiles/user/{userId}/default
   */
  getDefaultProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/user/${userId}/default`);
  }

  /**
   * Create new profile
   * API: POST /api/profiles/user/{userId}
   */
  createProfile(userId: string, request: CreateProfileRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(
      `${this.apiUrl}/user/${userId}`,
      request
    );
  }

  /**
   * Update profile
   * API: PUT /api/profiles/{profileId}
   */
  updateProfile(profileId: string, request: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(
      `${this.apiUrl}/${profileId}`,
      request
    );
  }

  /**
   * Delete profile
   * API: DELETE /api/profiles/{profileId}
   */
  deleteProfile(profileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${profileId}`);
  }

  /**
   * Set default profile
   * API: PUT /api/profiles/user/{userId}/default/{profileId}
   */
  setDefaultProfile(userId: string, profileId: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/user/${userId}/default/${profileId}`,
      {}
    );
  }

  /**
   * Get color for profile type
   */
  getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      'ADULT': '#4D96FF',
      'KIDS': '#FF6B9D',
      'TEEN': '#FFD93D'
    };
    return colors[type] || '#4D96FF';
  }

  /**
   * Get icon/emoji for profile type
   */
  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      'ADULT': '👤',
      'KIDS': '🎮',
      'TEEN': '👨'
    };
    return icons[type] || '👤';
  }

  /**
   * Get avatar URL using DiceBear API
   */
  getDefaultAvatar(type: string): string {
    const seed = type === 'KIDS' ? 'kids-avatar' : 'adult-avatar';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  /**
   * Get label for profile type
   */
  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ADULT': 'Profil Adulte',
      'KIDS': 'Profil Enfants',
      'TEEN': 'Profil Ado'
    };
    return labels[type] || 'Profil';
  }
}
