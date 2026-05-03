import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from '../../services/recommendation.service';
import { RecommendationResult } from '../../models/recommendation.model';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendation.html',
  styleUrls: ['./recommendation.css']
})
export class RecommendationComponent implements OnInit {

  recommendation: RecommendationResult | null = null;
  loading = false;
  error   = '';
  userId  = '69de328ede4e4073c4e7cb05';

  constructor(private recommendationService: RecommendationService) {}

  ngOnInit(): void {
    this.loadRecommendation();
  }

  loadRecommendation(): void {
    this.loading = true;
    this.error   = '';

    this.recommendationService.getRecommendation(this.userId)
      .subscribe({
        next: (data) => {
          this.recommendation = data;
          this.loading        = false;
        },
        error: (err) => {
          this.error   = 'Erreur lors du chargement';
          this.loading = false;
          console.error(err);
        }
      });
  }

  getBadgeColor(): string {
    switch (this.recommendation?.recommande) {
      case 'ELITE':   return '#FFD700';
      case 'PREMIUM': return '#C0C0C0';
      default:        return '#CD7F32';
    }
  }

  getBadgeIcon(): string {
    switch (this.recommendation?.recommande) {
      case 'ELITE':   return '👑';
      case 'PREMIUM': return '⭐';
      default:        return '🔵';
    }
  }
}