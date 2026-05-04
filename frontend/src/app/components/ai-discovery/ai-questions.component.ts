import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentRecommendationDTO, ContentService } from '../../services/api.service';

interface UserPreferencesFromAnswers {
  preferredCategories: string[];
  preferredTypes: string[];
  preferredGenres: string[];
  mood?: string;
}

@Component({
  selector: 'app-ai-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-questions.component.html',
  styleUrls: ['./ai-questions.component.css'],
})
export class AiQuestionsComponent implements OnInit {
  // Question answers (reactive)
  moodAnswer = signal<string>('');
  genreAnswer = signal<string[]>([]);
  categoryAnswer = signal<string[]>([]);

  // Live recommendations
  recommendations = signal<ContentRecommendationDTO[]>([]);

  // Available options
  moods = ['Action-Packed', 'Relaxing', 'Thought-Provoking', 'Thrilling', 'Romantic'];
  genres = ['Action', 'Drama', 'Comedy', 'Thriller', 'Romance', 'Sci-Fi', 'Family', 'Animation', 'History', 'Sports', 'Horror', 'Adventure'];
  categories = ['MOVIE', 'SERIES', 'DOCUMENTARY'];

  // Mood to genres mapping
  moodGenreMap: { [key: string]: string[] } = {
    'Action-Packed': ['Action', 'Adventure', 'Thriller'],
    'Relaxing': ['Comedy', 'Family', 'Romance'],
    'Thought-Provoking': ['Drama', 'History', 'Sci-Fi'],
    'Thrilling': ['Thriller', 'Horror', 'Action'],
    'Romantic': ['Romance', 'Drama', 'Comedy'],
  };

  questionsCompleted = computed(() => {
    return this.moodAnswer() !== '' && 
           this.genreAnswer().length > 0 &&
           this.categoryAnswer().length > 0;
  });

  progressPercentage = computed(() => {
    let completed = 0;
    if (this.moodAnswer() !== '') completed++;
    if (this.genreAnswer().length > 0) completed++;
    if (this.categoryAnswer().length > 0) completed++;
    return (completed / 3) * 100;
  });

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    // Auto-update recommendations when any answer changes
  }

  selectMood(mood: string): void {
    this.moodAnswer.set(mood);
    // Auto-add mood-related genres
    const moodGenres = this.moodGenreMap[mood] || [];
    this.genreAnswer.set(moodGenres);
    this.updateRecommendations();
  }

  toggleGenre(genre: string): void {
    const current = this.genreAnswer();
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    this.genreAnswer.set(updated);
    this.updateRecommendations();
  }

  toggleCategory(category: string): void {
    const current = this.categoryAnswer();
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    this.categoryAnswer.set(updated);
    this.updateRecommendations();
  }

  private updateRecommendations(): void {
    if (!this.questionsCompleted()) {
      this.recommendations.set([]);
      return;
    }

    const preferences: UserPreferencesFromAnswers = {
      preferredCategories: this.categoryAnswer(),
      preferredTypes: ['MOVIE', 'SERIES', 'DOCUMENTARY'],
      preferredGenres: this.genreAnswer(),
      mood: this.moodAnswer(),
    };

    // Call backend with dynamic preferences
    this.contentService.getContentRecommendationsByAnswers(preferences).subscribe({
      next: (data) => {
        this.recommendations.set(Array.isArray(data) ? data : []);
      },
      error: (err) => {
        console.error('Error fetching recommendations:', err);
        this.recommendations.set([]);
      },
    });
  }

  resetAnswers(): void {
    this.moodAnswer.set('');
    this.genreAnswer.set([]);
    this.categoryAnswer.set([]);
    this.recommendations.set([]);
  }

  getMoodClass(mood: string): string {
    return this.moodAnswer() === mood ? 'selected' : '';
  }

  getSelectedGenreCount(): number {
    return this.genreAnswer().length;
  }
}
