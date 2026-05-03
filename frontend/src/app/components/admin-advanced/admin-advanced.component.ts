import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService, ContentAnalyticsDTO, ContentSearchResultDTO } from '../../services/api.service';

@Component({
  selector: 'app-admin-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-advanced.component.html',
  styleUrls: ['./admin-advanced.component.css']
})
export class AdminAdvancedComponent implements OnInit {
  advancedKeyword = '';
  advancedGenreQuery = '';
  advancedCategory = '';
  advancedStatus = '';
  deliveryFallbackHours = 6;

  advancedSearchResults = signal<ContentSearchResultDTO[]>([]);
  analyticsList = signal<ContentAnalyticsDTO[]>([]);

  readonly deliveryStrategy = [
    {
      title: 'In-app first',
      description: 'Send the notification inside the platform immediately so users see it while they are active.',
    },
    {
      title: 'Email fallback',
      description: 'If the notification stays unread for the configured delay, trigger an email follow-up automatically.',
    },
    {
      title: 'Track engagement',
      description: 'Measure opens, clicks, and read states to decide which channel performs best for each audience.',
    },
  ];

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  hasAdvancedCriteria(): boolean {
    return !!(
      this.advancedKeyword.trim() ||
      this.advancedGenreQuery.trim() ||
      this.advancedCategory.trim() ||
      this.advancedStatus.trim()
    );
  }

  onAdvancedSearchInputChange(): void {
    if (!this.hasAdvancedCriteria()) {
      this.advancedSearchResults.set([]);
      return;
    }

    this.runAdvancedSearch();
  }

  runAdvancedSearch(): void {
    const keyword = this.advancedKeyword.trim();
    const genre = this.advancedGenreQuery.trim();
    const category = this.advancedCategory.trim();
    const status = this.advancedStatus.trim().toUpperCase();

    if (!keyword && !genre && !category && !status) {
      this.advancedSearchResults.set([]);
      return;
    }

    this.contentService.advancedContentSearch(
      keyword || undefined,
      genre || undefined,
      category || undefined,
      30
    ).subscribe({
      next: (data) => {
        const results = Array.isArray(data) ? data : [];
        const filteredByStatus = status
          ? results.filter(item => (item.status || '').toUpperCase() === status)
          : results;

        this.advancedSearchResults.set(filteredByStatus);
      },
      error: () => this.advancedSearchResults.set([])
    });
  }

  loadAnalytics(): void {
    this.contentService.getTop10Content(undefined, undefined).subscribe({
      next: (data) => this.analyticsList.set(Array.isArray(data) ? data : []),
      error: () => this.analyticsList.set([])
    });
  }

  topTenContent(): ContentAnalyticsDTO[] {
    return [...this.analyticsList()]
      .sort((left, right) => {
        const engagementDiff = right.engagementScore - left.engagementScore;
        if (engagementDiff !== 0) return engagementDiff;

        const viewDiff = right.viewCount - left.viewCount;
        if (viewDiff !== 0) return viewDiff;

        return left.title.localeCompare(right.title);
      })
      .slice(0, 10);
  }
}
