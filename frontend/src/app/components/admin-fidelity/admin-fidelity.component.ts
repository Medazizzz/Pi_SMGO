import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Plus, Edit2, Trash2, X, Check, Award, Crown, Star, Shield } from 'lucide-angular';
import { FidelityService } from '../../services/fidelity.service';
import { Fidelity, FidelityRequest, FidelityLevel } from '../../models/fidelity.model';
import { CountLevelPipe } from '../../pipes/count-level.pipe';

@Component({
  selector: 'app-admin-fidelity',
  standalone: true,
  imports: [CommonModule, FormsModule, CountLevelPipe],
  templateUrl: './admin-fidelity.component.html'
})
export class AdminFidelityComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly AwardIcon = Award;
  readonly CrownIcon = Crown;
  readonly StarIcon = Star;
  readonly ShieldIcon = Shield;

  fidelities: Fidelity[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  form: FidelityRequest = { points: 0, level: 'BRONZE', description: '' };
  levels: FidelityLevel[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  constructor(private service: FidelityService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.fidelities = data; this.loading = false; },
      error: () => { this.errorMessage = 'Loading failed.'; this.loading = false; }
    });
  }

  openCreate(): void {
    this.form = { points: 0, level: 'BRONZE', description: '' };
    this.isEditing.set(false);
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openEdit(f: Fidelity): void {
    this.form = { points: f.points, level: f.level, description: f.description };
    this.isEditing.set(true);
    this.editingId.set(f.id);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.errorMessage = '';
  }

  submit(): void {
    if (this.isEditing()) {
      this.service.update(this.editingId()!, this.form).subscribe({
        next: () => { this.closeModal(); this.loadAll(); this.showSuccess('Loyalty level updated.'); },
        error: () => { this.errorMessage = 'Update failed.'; }
      });
    } else {
      this.service.create(this.form).subscribe({
        next: () => { this.closeModal(); this.loadAll(); this.showSuccess('Loyalty level created.'); },
        error: () => { this.errorMessage = 'Creation failed.'; }
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Delete this loyalty level?')) return;
    this.service.delete(id).subscribe({
      next: () => { this.fidelities = this.fidelities.filter(f => f.id !== id); this.showSuccess('Loyalty level deleted.'); },
      error: () => { this.errorMessage = 'Delete failed.'; }
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'border-blue-400 text-blue-400';
      case 'GOLD': return 'border-yellow-500 text-yellow-500';
      case 'SILVER': return 'border-gray-400 text-gray-400';
      default: return 'border-orange-600 text-orange-600';
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


