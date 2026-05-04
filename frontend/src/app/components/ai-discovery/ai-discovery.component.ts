import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRecommendationDTO, ContentService } from '../../services/api.service';
import { AiQuestionsComponent } from './ai-questions.component';

@Component({
  selector: 'app-ai-discovery',
  standalone: true,
  imports: [CommonModule, AiQuestionsComponent],
  templateUrl: './ai-discovery.component.html',
  styleUrls: ['./ai-discovery.component.css'],
})
export class AiDiscoveryComponent implements OnInit {
  readonly recommendations = signal<ContentRecommendationDTO[]>([]);
  readonly currentMode = signal<'interactive' | 'static'>('interactive');

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  switchMode(mode: 'interactive' | 'static'): void {
    this.currentMode.set(mode);
    if (mode === 'static') {
      this.loadRecommendations();
    }
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


