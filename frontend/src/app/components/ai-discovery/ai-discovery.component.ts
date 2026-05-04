import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRecommendationDTO, ContentService } from '../../services/api.service';

@Component({
  selector: 'app-ai-discovery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-discovery.component.html',
  styleUrls: ['./ai-discovery.component.css'],
})
export class AiDiscoveryComponent implements OnInit {
  readonly recommendations = signal<ContentRecommendationDTO[]>([]);

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    const currentUser = localStorage.getItem('currentUser');
    const userId = currentUser ? this.extractUserId(currentUser) : undefined;

    this.contentService.getContentRecommendations(userId, 6).subscribe({
      next: (data) => {
        this.recommendations.set(Array.isArray(data) ? data : []);
      },
      error: () => this.recommendations.set([]),
    });
  }

  private extractUserId(rawValue: string): string | undefined {
    try {
      const parsed = JSON.parse(rawValue);
      return parsed?.userId ? String(parsed.userId) : undefined;
    } catch {
      return undefined;
    }
  }
}


