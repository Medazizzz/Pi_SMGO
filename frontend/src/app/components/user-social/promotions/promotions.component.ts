import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PromotionService, Promotion } from '../../../services/promotion.service';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './promotions.component.html'
})
export class PromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  promotionForm: FormGroup;
  editingId: string | null = null;
  isAdmin = false;
  searchCode = '';
  foundPromotion: Promotion | null = null;
  searchError = '';

  constructor(
    private promotionService: PromotionService,
    private fb: FormBuilder
  ) {
    const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
    this.isAdmin = userRole.includes('ADMIN');

    this.promotionForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      pourcentageReduction: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      dateExpiration: ['', Validators.required],
      clientId: ['']
    });
  }

  ngOnInit() {
    this.loadPromotions();
  }

  loadPromotions() {
    const call = this.isAdmin ? this.promotionService.getAll() : this.promotionService.getActive();
    call.subscribe(data => this.promotions = data);
  }

  onSubmit() {
    if (this.promotionForm.invalid) {
      return;
    }

    const payload = {
      ...this.promotionForm.value,
      dateExpiration: new Date(this.promotionForm.value.dateExpiration).toISOString()
    };

    if (this.editingId) {
      this.promotionService.update(this.editingId, payload).subscribe(() => {
        this.loadPromotions();
        this.resetForm();
      });
      return;
    }

    this.promotionService.create(payload).subscribe(() => {
      this.loadPromotions();
      this.resetForm();
    });
  }

  editPromotion(p: Promotion) {
    this.editingId = p.id!;
    this.promotionForm.patchValue({
      code: p.code,
      pourcentageReduction: p.pourcentageReduction,
      dateExpiration: p.dateExpiration?.substring(0, 10),
      clientId: p.clientId || ''
    });
  }

  deactivate(id: string) {
    this.promotionService.deactivate(id).subscribe(() => this.loadPromotions());
  }

  delete(id: string) {
    if (confirm('Delete this promotion?')) {
      this.promotionService.delete(id).subscribe(() => this.loadPromotions());
    }
  }

  searchByCode() {
    if (!this.searchCode.trim()) {
      return;
    }

    this.searchError = '';
    this.foundPromotion = null;

    this.promotionService.getByCode(this.searchCode.trim()).subscribe({
      next: p => this.foundPromotion = p,
      error: () => this.searchError = 'Promo code not found.'
    });
  }

  resetForm() {
    this.editingId = null;
    this.promotionForm.reset();
  }
}
