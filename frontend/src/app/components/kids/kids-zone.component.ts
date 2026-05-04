import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KidsService } from '../../services/kids.service';
import { KidsContent } from '../../models/kids.model';
import { Play, Home, LogOut } from 'lucide-angular';

/**
 * Kids Zone Component
 * WHY: Special kids-only interface for watching movies and series
 * Simple, colorful, and fun design for children
 * NO complex features - just entertainment!
 */
@Component({
  selector: 'app-kids-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kids-zone.component.html',
  styleUrls: ['./kids-zone.component.css'],
})
export class KidsZoneComponent implements OnInit {
  readonly PlayIcon = Play;
  readonly HomeIcon = Home;
  readonly LogOutIcon = LogOut;

  // Signals for state management
  content = signal<KidsContent[]>([]);
  isLoading = signal<boolean>(false);
  hoveredContentId = signal<string | null>(null);
  selectedProfile = signal<string>('');

  constructor(
    private kidsService: KidsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadKidsContent();
    this.loadSelectedProfile();
  }

  /**
   * Load all kids content (movies and series only)
   */
  private loadKidsContent(): void {
    this.isLoading.set(true);
    this.kidsService.getAllContent().subscribe({
      next: (allContent) => {
        // Filter only movies and series
        const filtered = allContent.filter(
          item => item.contentType === 'MOVIE' || item.contentType === 'SERIES'
        );
        this.content.set(filtered);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading kids content:', error);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Load selected profile name
   */
  private loadSelectedProfile(): void {
    const profileStr = localStorage.getItem('selectedProfile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      this.selectedProfile.set(profile.name || 'Kids');
    }
  }

  /**
   * Watch content (dummy action for now)
   */
  watchContent(content: KidsContent): void {
    console.log('Playing:', content.title);
    // TODO: Implement video player
    alert(`🎬 Now watching: ${content.title}`);
  }

  /**
   * Set hovered content
   */
  setHoveredContent(contentId: string | null): void {
    this.hoveredContentId.set(contentId);
  }

  /**
   * Go back to profile selection
   */
  goBackToProfiles(): void {
    localStorage.removeItem('selectedProfile');
    this.router.navigate(['/auth/select-profile']);
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedProfile');
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get age group emoji
   */
  getAgeGroupEmoji(ageGroup: string): string {
    const emojis: { [key: string]: string } = {
      '2-5': '👶',
      '6-9': '👧',
      '10-13': '👦',
      'FAMILY': '👨‍👩‍👧‍👦',
    };
    return emojis[ageGroup] || '🎮';
  }

  /**
   * Get rating stars
   */
  getRatingStars(rating: number): string {
    const stars = Math.round(rating);
    return '⭐'.repeat(Math.min(stars, 5));
  }

  /**
   * Get content type emoji
   */
  getContentTypeEmoji(contentType: string): string {
    const emojis: { [key: string]: string } = {
      'MOVIE': '🎬',
      'SERIES': '📺',
      'ANIMATION': '🎨',
      'EDUCATIONAL': '📚',
    };
    return emojis[contentType] || '🎮';
  }
}
