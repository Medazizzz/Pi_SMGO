import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/profile.model';
import { Plus, Settings } from 'lucide-angular';

/**
 * Profile Selection Component
 * WHY: Allows users to choose which profile to use after login
 * Provides family account management like Netflix/Shahid
 */
@Component({
  selector: 'app-profile-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-selection.component.html',
  styleUrls: ['./profile-selection.component.css'],
})
export class ProfileSelectionComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly SettingsIcon = Settings;

  profiles = signal<UserProfile[]>([]);
  isLoading = signal<boolean>(false);
  hoveredProfileId = signal<string | null>(null);
  showAddProfileModal = signal<boolean>(false);
  newProfileName = signal<string>('');
  newProfileType = signal<'ADULT' | 'KIDS' | 'TEEN'>('KIDS');

  userName = signal<string>('');

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    this.loadUserName();
  }

  /**
   * Load user profiles
   */
  private loadProfiles(): void {
    this.isLoading.set(true);
    const userId = this.authService.getCurrentUserId();
    
    if (userId) {
      this.profileService.getUserProfiles(userId).subscribe({
        next: (profiles) => {
          this.profiles.set(profiles);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading profiles:', error);
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Load current user name
   */
  private loadUserName(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.username || 'User');
    }
  }

  /**
   * Select profile and navigate
   */
  selectProfile(profile: UserProfile): void {
    // Store selected profile in localStorage
    localStorage.setItem('selectedProfile', JSON.stringify(profile));
    
    console.log('Profile selected:', profile.name, profile.type);
    
    // Determine route based on profile type
    if (profile.type === 'KIDS') {
      console.log('Navigating to kids zone...');
      this.router.navigate(['/kids']).catch(err => {
        console.error('Navigation error:', err);
        // Fallback to home if kids route fails
        this.router.navigate(['/user/home']);
      });
    } else {
      console.log('Navigating to home...');
      this.router.navigate(['/user/home']).catch(err => {
        console.error('Navigation error:', err);
      });
    }
  }

  /**
   * Open add profile modal
   */
  openAddProfileModal(): void {
    this.showAddProfileModal.set(true);
  }

  /**
   * Close add profile modal
   */
  closeAddProfileModal(): void {
    this.showAddProfileModal.set(false);
    this.newProfileName.set('');
    this.newProfileType.set('KIDS');
  }

  /**
   * Create new profile
   */
  createProfile(): void {
    if (this.newProfileName().trim()) {
      this.profileService.createProfile({
        name: this.newProfileName(),
        type: this.newProfileType(),
      }).subscribe({
        next: () => {
          this.closeAddProfileModal();
          this.loadProfiles();
        },
        error: (error) => {
          console.error('Error creating profile:', error);
        },
      });
    }
  }

  /**
   * Open profile management
   */
  openProfileManagement(): void {
    // TODO: Navigate to profile management page
    console.log('Open profile management');
  }

  /**
   * Set hovered profile
   */
  setHoveredProfile(profileId: string | null): void {
    this.hoveredProfileId.set(profileId);
  }

  /**
   * Get profile color
   */
  getProfileColor(profile: UserProfile): string {
    return profile.color || '#4D96FF';
  }

  /**
   * Get profile icon
   */
  getProfileIcon(profile: UserProfile): string {
    return this.profileService.getIconForType(profile.type);
  }

  /**
   * Get profile type label
   */
  getProfileTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ADULT': 'Adulte',
      'KIDS': 'Enfants',
      'TEEN': 'Ado',
    };
    return labels[type] || type;
  }
}
