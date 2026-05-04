import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Award, Crown, Star, Shield } from 'lucide-angular';
import { FidelityService } from '../../services/fidelity.service';
import { Fidelity } from '../../models/fidelity.model';

@Component({
  selector: 'app-user-fidelity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-fidelity.component.html'
})
export class UserFidelityComponent implements OnInit {
  readonly AwardIcon = Award;
  readonly CrownIcon = Crown;
  readonly StarIcon = Star;
  readonly ShieldIcon = Shield;

  fidelities: Fidelity[] = [];
  loading = false;
  errorMessage = '';

  constructor(private service: FidelityService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.fidelities = data; this.loading = false; },
      error: () => { this.errorMessage = 'Unable to load loyalty levels.'; this.loading = false; }
    });
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'border-blue-400 text-blue-400';
      case 'GOLD': return 'border-yellow-500 text-yellow-500';
      case 'SILVER': return 'border-gray-400 text-gray-300';
      default: return 'border-orange-600 text-orange-500';
    }
  }

  getLevelGlow(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'hover:shadow-blue-400/20 border-blue-400/40';
      case 'GOLD': return 'hover:shadow-yellow-500/20 border-yellow-500/40';
      case 'SILVER': return 'hover:shadow-gray-400/20 border-gray-400/40';
      default: return 'hover:shadow-orange-600/20 border-orange-600/40';
    }
  }

  getLevelIcon(level: string): any {
    switch (level) {
      case 'PLATINUM': return this.StarIcon;
      case 'GOLD': return this.CrownIcon;
      case 'SILVER': return this.ShieldIcon;
      default: return this.AwardIcon;
    }
  }

  getLevelBg(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'bg-blue-400/10';
      case 'GOLD': return 'bg-yellow-500/10';
      case 'SILVER': return 'bg-gray-400/10';
      default: return 'bg-orange-600/10';
    }
  }
}


