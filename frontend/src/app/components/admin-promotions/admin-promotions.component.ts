import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-angular';
import { PromotionService, Promotion } from '../../services/promotion.service';

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-promotions.component.html'
})
export class AdminPromotionsComponent implements OnInit {
  readonly TagIcon = Tag;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly ToggleLeftIcon = ToggleLeft;
  readonly ToggleRightIcon = ToggleRight;

  promotions: Promotion[] = [];
  showForm = false;
  promoForm: FormGroup;
  editingId: string | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private promotionService: PromotionService,
    private fb: FormBuilder
  ) {
    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      pourcentageReduction: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      dateExpiration: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.loading = true;
    this.promotionService.getAll().subscribe({
      next: (data) => {
        this.promotions = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load promotions.';
        this.loading = false;
      }
    });
  }

  get totalPromos(): number {
    return this.promotions.length;
  }

  get activePromos(): number {
    return this.promotions.filter(p => p.active).length;
  }

  onSubmit(): void {
    if (this.promoForm.invalid) {
      return;
    }

    this.loading = true;
    const isUpdate = !!this.editingId;
    const payload = {
      ...this.promoForm.value,
      active: true,
      dateExpiration: new Date(this.promoForm.value.dateExpiration).toISOString()
    };

    const request$ = this.editingId
      ? this.promotionService.update(this.editingId, payload)
      : this.promotionService.create(payload);

    request$.subscribe({
      next: () => {
        this.loadPromotions();
        this.promoForm.reset();
        this.showForm = false;
        this.editingId = null;
        this.loading = false;
        this.successMessage = isUpdate ? 'Promotion updated successfully.' : 'Promotion created successfully.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.errorMessage = 'Unable to save promotion.';
        this.loading = false;
      }
    });
  }

  editPromotion(promo: Promotion): void {
    this.editingId = promo.id || null;
    this.showForm = true;
    this.promoForm.patchValue({
      code: promo.code,
      pourcentageReduction: promo.pourcentageReduction,
      dateExpiration: promo.dateExpiration?.substring(0, 10)
    });
  }

  deactivate(id: string): void {
    this.promotionService.deactivate(id).subscribe(() => this.loadPromotions());
  }

  delete(id: string): void {
    if (confirm('Delete this promotion?')) {
      this.promotionService.delete(id).subscribe(() => this.loadPromotions());
    }
  }
}


