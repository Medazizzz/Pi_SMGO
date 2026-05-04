import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KidsService } from '../../services/kids.service';
import { KidsContent, KidsCategory, AgeGroup, KidsContentType } from '../../models/kids.model';
import { Play, Search, Heart, Share2, Star } from 'lucide-angular';

/**
 * Kids Component
 * WHY: Main component for the kids section with fun, colorful design
 * Provides age-appropriate content and interactive features for children
 */
@Component({
  selector: 'app-kids',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kids.component.html',
  styleUrls: ['./kids.component.css'],
})
export class KidsComponent implements OnInit {
  readonly PlayIcon = Play;
  readonly SearchIcon = Search;
  readonly HeartIcon = Heart;
  readonly Share2Icon = Share2;
  readonly StarIcon = Star;

  // Signals for reactive state management
  allContent = signal<KidsContent[]>([]);
  featuredContent = signal<KidsContent[]>([]);
  categories = signal<KidsCategory[]>([]);
  filteredContent = signal<KidsContent[]>([]);
  selectedAgeGroup = signal<AgeGroup | null>(null);
  selectedCategory = signal<string | null>(null);
  searchQuery = signal<string>('');
  hoveredContent = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  selectedContent = signal<KidsContent | null>(null);

  // Animation states
  contentAnimations = new Map<string, boolean>();

  constructor(private kidsService: KidsService) {}

  ngOnInit(): void {
    this.loadContent();
    this.loadCategories();
  }

  /**
   * Load all kids content
   */
  private loadContent(): void {
    this.isLoading.set(true);
    this.kidsService.getAllContent().subscribe({
      next: (content) => {
        this.allContent.set(content);
        this.filteredContent.set(content);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading kids content:', error);
        this.isLoading.set(false);
      },
    });

    this.kidsService.getFeaturedContent().subscribe({
      next: (featured) => {
        this.featuredContent.set(featured);
      },
    });
  }

  /**
   * Load categories
   */
  private loadCategories(): void {
    this.kidsService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
    });
  }

  /**
   * Filter content by age group
   */
  filterByAgeGroup(ageGroup: AgeGroup): void {
    this.selectedAgeGroup.set(this.selectedAgeGroup() === ageGroup ? null : ageGroup);
    this.selectedCategory.set(null);
    this.applyFilters();
  }

  /**
   * Filter content by category
   */
  filterByCategory(categoryId: string): void {
    this.selectedCategory.set(
      this.selectedCategory() === categoryId ? null : categoryId
    );
    this.selectedAgeGroup.set(null);
    this.applyFilters();
  }

  /**
   * Search content
   */
  searchContent(query: string): void {
    this.searchQuery.set(query);
    if (query.trim().length > 0) {
      this.kidsService.searchContent(query).subscribe({
        next: (results) => {
          this.filteredContent.set(results);
        },
      });
    } else {
      this.applyFilters();
    }
  }

  /**
   * Apply all filters
   */
  private applyFilters(): void {
    const ageGroup = this.selectedAgeGroup();
    const categoryId = this.selectedCategory();

    if (ageGroup) {
      this.kidsService.getContentByAgeGroup(ageGroup).subscribe({
        next: (content) => {
          this.filteredContent.set(content);
        },
      });
    } else if (categoryId === 'educational') {
      this.kidsService.getEducationalContent().subscribe({
        next: (content) => {
          this.filteredContent.set(content);
        },
      });
    } else {
      this.filteredContent.set(this.allContent());
    }
  }

  /**
   * Set hovered content
   */
  setHoveredContent(contentId: string | null): void {
    this.hoveredContent.set(contentId);
  }

  /**
   * Select content to view details
   */
  selectContent(content: KidsContent): void {
    this.selectedContent.set(content);
  }

  /**
   * Close content details
   */
  closeDetails(): void {
    this.selectedContent.set(null);
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(content: KidsContent): void {
    content.isFavorite = !content.isFavorite;
  }

  /**
   * Play content
   */
  playContent(content: KidsContent): void {
    console.log('Playing:', content.title);
    // Navigate to player or perform playback action
  }

  /**
   * Get category color
   */
  getCategoryColor(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.color || '#FF6B9D';
  }

  /**
   * Get age group badge
   */
  getAgeGroupBadge(ageGroup: AgeGroup): string {
    const badges: { [key: string]: string } = {
      '2-5': '👶 Toddlers',
      '6-9': '👧 Kids',
      '10-13': '👦 Tweens',
      'FAMILY': '👨‍👩‍👧‍👦 Family',
    };
    return badges[ageGroup] || ageGroup;
  }

  /**
   * Get emoji for content type
   */
  getContentTypeEmoji(type: KidsContentType): string {
    const emojis: { [key: string]: string } = {
      'MOVIE': '🎬',
      'SERIES': '📺',
      'EDUCATIONAL': '📚',
      'ANIMATION': '🎨',
    };
    return emojis[type] || '🎞️';
  }
}
