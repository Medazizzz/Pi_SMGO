import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlService, PredictionResponse, SeanceRequest } from '../../services/ml.service';
 
@Component({
  selector: 'app-ai-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-discovery.component.html',
  styleUrls: ['./ai-discovery.component.css'],
})
export class AiDiscoveryComponent {
  result: PredictionResponse | null = null;
  loading = false;
  error = '';
 
  seance: SeanceRequest = {
    salle_capacity: 150,
    seats_reserved: 50,
    heure_num: 20,
    day_of_week_num: 5,
    is_weekend: 1,
    is_holiday: 0,
    is_school_vacation: 0,
    is_before_holiday: 0,
    month: 7,
    avg_taux_cinema: 0.55,
    avg_taux_salle: 0.6,
    avg_taux_creneau: 0.65,
    avg_taux_contenu: 0.5,
    history_cinema: 100,
    history_salle: 50,
  };
 
  constructor(private readonly mlService: MlService) {}
 
  predict(): void {
    this.loading = true;
    this.error = '';
    this.result = null;
 
    this.mlService.predict(this.seance).subscribe({
      next: response => {
        this.result = response;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors de la prédiction. Vérifie que Spring Boot et FastAPI sont lancés.';
        this.loading = false;
      }
    });
  }
 
  getBadgeColor(): string {
    switch (this.result?.prediction) {
      case 'FAIBLE':
        return '#ef4444';
      case 'MOYEN':
        return '#f59e0b';
      case 'ELEVE':
        return '#38bdf8';
      case 'COMPLET':
        return '#22c55e';
      default:
        return '#64748b';
    }
  }
 
  getActionColor(): string {
    const action = this.result?.action ?? '';
    if (action.includes('ANNULER') || action.includes('URGENTE') || action.includes('FORTE')) {
      return '#ef4444';
    }
 
    if (action.includes('AJUSTER') || action.includes('AUGMENTER') || action.includes('RÉDUIRE')) {
      return '#f59e0b';
    }
 
    return '#22c55e';
  }
}