import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Crown, Star, CreditCard } from 'lucide-angular';
import { AbonnementService } from '../../services/abonnement.service';
import { Abonnement } from '../../models/abonnement.model';

@Component({
  selector: 'app-user-abonnement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-abonnement.component.html'
})
export class UserAbonnementComponent implements OnInit {
  readonly CrownIcon = Crown;
  readonly StarIcon = Star;
  readonly CreditCardIcon = CreditCard;

  abonnements: Abonnement[] = [];
  loading = false;
  errorMessage = '';

  constructor(private service: AbonnementService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.abonnements = data; this.loading = false; },
      error: () => { this.errorMessage = 'Unable to load subscription plans.'; this.loading = false; }
    });
  }

  isPremium(a: Abonnement): boolean {
    return a.type === 'PREMIUM';
  }
}


