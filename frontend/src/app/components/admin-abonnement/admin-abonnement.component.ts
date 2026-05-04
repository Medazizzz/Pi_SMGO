import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Plus, Edit2, Trash2, X, Check, CreditCard, Crown, Star } from 'lucide-angular';
import { AbonnementService } from '../../services/abonnement.service';
import { Abonnement, AbonnementRequest, AbonnementType } from '../../models/abonnement.model';
import { CountTypePipe } from '../../pipes/count-type.pipe';

@Component({
  selector: 'app-admin-abonnement',
  standalone: true,
  imports: [CommonModule, FormsModule, CountTypePipe],
  templateUrl: './admin-abonnement.component.html'
})
export class AdminAbonnementComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly CreditCardIcon = CreditCard;
  readonly CrownIcon = Crown;
  readonly StarIcon = Star;

  abonnements: Abonnement[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  form: AbonnementRequest = { type: 'BASIC', prix: 0, description: '' };
  types: AbonnementType[] = ['BASIC', 'PREMIUM'];

  constructor(private service: AbonnementService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.abonnements = data; this.loading = false; },
      error: () => { this.errorMessage = 'Loading failed.'; this.loading = false; }
    });
  }

  openCreate(): void {
    this.form = { type: 'BASIC', prix: 0, description: '' };
    this.isEditing.set(false);
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openEdit(a: Abonnement): void {
    this.form = { type: a.type, prix: a.prix, description: a.description };
    this.isEditing.set(true);
    this.editingId.set(a.id);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.errorMessage = '';
  }

  submit(): void {
    if (this.isEditing()) {
      this.service.update(this.editingId()!, this.form).subscribe({
        next: () => { this.closeModal(); this.loadAll(); this.showSuccess('Subscription updated.'); },
        error: () => { this.errorMessage = 'Update failed.'; }
      });
    } else {
      this.service.create(this.form).subscribe({
        next: () => { this.closeModal(); this.loadAll(); this.showSuccess('Subscription created.'); },
        error: () => { this.errorMessage = 'Creation failed.'; }
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Delete this subscription?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.abonnements = this.abonnements.filter(a => a.id !== id); this.showSuccess('Subscription deleted.'); },
      error: () => { this.errorMessage = 'Delete failed.'; }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }

  getTypeColor(type: string): string {
    return type === 'PREMIUM'
      ? 'border-yellow-500 text-yellow-500'
      : 'border-[#8B5CF6] text-[#8B5CF6]';
  }
}


