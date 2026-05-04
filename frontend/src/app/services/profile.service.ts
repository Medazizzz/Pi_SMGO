import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { UserProfile, ProfileSelectionData, CreateProfileRequest, ProfileType } from '../models/profile.model';

/**
 * Profile Service
 * WHY: Manages user profiles and family accounts
 * Provides profile selection and management
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/api/profiles';

  // Mock profiles for demo
  private mockProfiles: { [userId: string]: UserProfile[] } = {
    'user_123': [
      {
        id: 'profile_1',
        userId: 'user_123',
        name: 'mayssen',
        type: 'ADULT',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mayssen',
        color: '#4D96FF',
        isDefault: true,
      },
      {
        id: 'profile_2',
        userId: 'user_123',
        name: 'Enfants',
        type: 'KIDS',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kids&backgroundColor=FF6B9D',
        color: '#FF6B9D',
      },
    ]
  };

  constructor(private http: HttpClient) {}

  /**
   * Get profiles for current user
   */
  getUserProfiles(userId: string): Observable<UserProfile[]> {
    // Replace with actual API call when backend is ready
    // return this.http.get<UserProfile[]>(`${this.apiUrl}/user/${userId}`);
    return of(this.mockProfiles[userId] || []);
  }

  /**
   * Get profile by ID
   */
  getProfileById(profileId: string): Observable<UserProfile | undefined> {
    // Replace with actual API call
    return of(undefined);
  }

  /**
   * Create new profile
   */
  createProfile(request: CreateProfileRequest): Observable<UserProfile> {
    // Get current user ID from localStorage or auth
    const userId = localStorage.getItem('currentUser') 
      ? JSON.parse(localStorage.getItem('currentUser')!).userId || 'user_123'
      : 'user_123';

    const newProfile: UserProfile = {
      id: 'profile_' + Date.now(),
      userId: userId,
      name: request.name,
      type: request.type,
      avatar: request.avatar || this.getDefaultAvatar(request.type),
      color: this.getColorForType(request.type),
      isDefault: false,
    };

    // Add to mock profiles
    if (!this.mockProfiles[userId]) {
      this.mockProfiles[userId] = [];
    }
    this.mockProfiles[userId].push(newProfile);

    return of(newProfile);
  }

  /**
   * Update profile
   */
  updateProfile(profileId: string, request: Partial<UserProfile>): Observable<UserProfile> {
    // return this.http.put<UserProfile>(`${this.apiUrl}/${profileId}`, request);
    return of({ id: profileId } as UserProfile);
  }

  /**
   * Delete profile
   */
  deleteProfile(profileId: string): Observable<void> {
    // return this.http.delete<void>(`${this.apiUrl}/${profileId}`);
    return of(undefined);
  }

  /**
   * Set default profile
   */
  setDefaultProfile(profileId: string): Observable<void> {
    // return this.http.put<void>(`${this.apiUrl}/${profileId}/default`, {});
    return of(undefined);
  }

  /**
   * Get default avatar for profile type
   */
  getDefaultAvatar(type: ProfileType): string {
    const seed = type === 'KIDS' ? 'kids' : 'adult';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  /**
   * Get color for profile type
   */
  getColorForType(type: ProfileType): string {
    const colors: { [key in ProfileType]: string } = {
      'ADULT': '#4D96FF',
      'KIDS': '#FF6B9D',
      'TEEN': '#FFD93D',
    };
    return colors[type] || '#4D96FF';
  }

  /**
   * Get icon emoji for profile type
   */
  getIconForType(type: ProfileType): string {
    const icons: { [key in ProfileType]: string } = {
      'ADULT': '👤',
      'KIDS': '🎮',
      'TEEN': '👨',
    };
    return icons[type] || '👤';
  }
}
