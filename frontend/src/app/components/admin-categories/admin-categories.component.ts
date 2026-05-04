import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Plus, Edit2, Trash2, X, Loader, Inbox } from 'lucide-angular';
import { ContentService, CategoryDTO } from '../../services/api.service';
import { CustomValidators } from '../../services/validators';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css'],
})
export class AdminCategoriesComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly CloseIcon = X;
  readonly LoaderIcon = Loader;
  readonly InboxIcon = Inbox;

  categoryList = signal<CategoryDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  categoryForm!: FormGroup;
  private readonly allowedTextCharactersRegex = /[^\p{L}\p{N}\s\-',.àâäéèêëïîôöùûüçœæÀÂÄÉÈÊËÏÎÔÖÙÛÜÇŒÆ]/gu;

  constructor(
    private contentService: ContentService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCategories();
  }

  /**
   * Normalize category payloads from mixed legacy/new backend shapes.
   * WHY: Some legacy records may use alternative keys (e.g. _id, categoryName, title).
   */
  private normalizeCategory(raw: unknown): CategoryDTO {
    const data = (raw ?? {}) as Record<string, unknown>;
    const clean = (value: unknown): string => String(value ?? '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    const id = String(data['id'] ?? data['_id'] ?? '').trim();
    const name = clean(data['name'] ?? data['categoryName'] ?? data['title']);
    const description = clean(data['description'] ?? data['details']);

    // Don't create default values - only return actual data
    const rawType = clean(data['contentType'] ?? data['type'] ?? 'MOVIE').toUpperCase();
    const contentType: 'MOVIE' | 'SERIES' | 'DOCUMENTARY' =
      rawType === 'SERIES' || rawType === 'DOCUMENTARY' ? rawType : 'MOVIE';

    return {
      id: id || undefined,
      name,
      description,
      contentType,
    };
  }

  /**
   * Initialize the reactive form for category CRUD operations
   * WHY: Centralized form configuration with validation rules
   */
  initializeForm() {
    this.categoryForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          CustomValidators.minLength(2),
          CustomValidators.maxLength(100),
          CustomValidators.noSpecialCharacters,
          CustomValidators.noLeadingTrailingWhitespace
        ]
      ],
      description: [
        '',
        [
          Validators.required,
          CustomValidators.minLength(5),
          CustomValidators.maxLength(500),
          CustomValidators.noLeadingTrailingWhitespace
        ]
      ]
    });
  }

  /**
   * Load all categories from the backend
   * WHY: Populate the category list on component initialization
   */
  loadCategories() {
    this.loading.set(true);
    this.error.set(null);

    this.contentService.getAllCategories().subscribe({
      next: (data) => {
        const normalized = (Array.isArray(data) ? data : [])
          .map(item => this.normalizeCategory(item))
          .filter(category => {
            // Only include categories with valid, non-empty names and descriptions
            return category.name && 
                   category.name.trim().length > 0 && 
                   category.description && 
                   category.description.trim().length > 0;
          });
        this.categoryList.set(normalized);
        this.loading.set(false);
        console.log(`✓ Loaded ${normalized.length} category(ies)`);
        if (data.length > normalized.length) {
          console.warn(`⚠ ${data.length - normalized.length} invalid category(ies) were filtered out`);
        }
      },
      error: (err) => {
        const errorMessage = err.message || 'Failed to load categories';
        this.error.set(errorMessage);
        this.loading.set(false);
        console.error('Error loading categories:', err);
      }
    });
  }

  /**
   * Open the category form for creating a new category
   * WHY: Reset form state and show the creation form
   */
  openForm() {
    this.editingId.set(null);
    this.categoryForm.reset({
      name: '',
      description: ''
    });
    this.showForm.set(true);
  }

  /**
   * Close the category form
   * WHY: Hide the form and reset editing state
   */
  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.categoryForm.reset({
      name: '',
      description: ''
    });
  }

  /**
   * Edit an existing category
   * WHY: Populate form with existing data and set editing mode
   * @param category The category to edit
   */
  editCategory(category: CategoryDTO) {
    if (!category.id) {
      this.error.set('Error: Category ID is missing');
      return;
    }
    this.editingId.set(category.id);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
    this.showForm.set(true);
  }

  private normalizeContentType(value?: string): 'MOVIE' | 'SERIES' | 'DOCUMENTARY' {
    if (value === 'SERIES' || value === 'DOCUMENTARY' || value === 'MOVIE') {
      return value;
    }
    return 'MOVIE';
  }

  /**
   * Save or update category based on editing state
   * WHY: Unified method for both create and update operations
   */
  saveCategory() {
    if (this.categoryForm.invalid) {
      Object.keys(this.categoryForm.controls).forEach(key => {
        const control = this.categoryForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    const formData: CategoryDTO = this.categoryForm.value;

    const editingId = this.editingId();
    if (editingId) {
      this.updateCategory(editingId, formData);
    } else {
      this.createCategory(formData);
    }
  }

  /**
   * Create a new category
   * WHY: Send POST request to backend
   * @param category The category data to create
   */
  private createCategory(category: CategoryDTO) {
    const payload: CategoryDTO = {
      ...category
    };

    this.contentService.createCategory(payload).subscribe({
      next: (newCategory) => {
        this.categoryList.set([...this.categoryList(), this.normalizeCategory(newCategory)]);
        this.loadCategories();
        this.closeForm();
        this.loading.set(false);
      },
      error: (err) => {
        const errorMessage = err.message || 'Failed to create category';
        this.error.set(errorMessage);
        this.loading.set(false);
        console.error('Error creating category:', err);
      }
    });
  }

  /**
   * Update an existing category
   * WHY: Send PUT request to backend
   * @param id The category ID to update
   * @param category The updated category data
   */
  private updateCategory(id: string, category: CategoryDTO) {
    const payload: CategoryDTO = {
      ...category
    };

    this.contentService.updateCategory(id, payload).subscribe({
      next: (updatedCategory) => {
        const normalizedUpdated = this.normalizeCategory(updatedCategory);
        const updatedList = this.categoryList().map(c => c.id === id ? normalizedUpdated : c);
        this.categoryList.set(updatedList);
        this.loadCategories();
        this.closeForm();
        this.loading.set(false);
      },
      error: (err) => {
        const errorMessage = err.message || 'Failed to update category';
        this.error.set(errorMessage);
        this.loading.set(false);
        console.error('Error updating category:', err);
      }
    });
  }

  /**
   * Delete a category
   * WHY: Send DELETE request to backend with user confirmation
   * @param id The category ID to delete
   */
  deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    this.loading.set(true);
    this.contentService.deleteCategory(id).subscribe({
      next: () => {
        this.categoryList.set(this.categoryList().filter(c => c.id !== id));
        this.loadCategories();
        this.loading.set(false);
      },
      error: (err) => {
        const errorMessage = err.message || 'Failed to delete category';
        this.error.set(errorMessage);
        this.loading.set(false);
        console.error('Error deleting category:', err);
      }
    });
  }

  /**
   * Get validation error message for a form field
   * WHY: Provide user-friendly error messages for form validation
   * @param fieldName The name of the form field
   * @returns The error message or null if no error
   */
  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.errors['minlength']) {
      return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['specialCharacters']) {
      return `${fieldName} cannot contain special characters`;
    }
    if (field.errors['leadingTrailingWhitespace']) {
      return `${fieldName} cannot start or end with spaces`;
    }

    return 'Invalid field';
  }

  /**
   * Check if a field has a validation error
   * WHY: Used in template to show error styling
   * @param fieldName The name of the form field
   * @returns True if the field has an error
   */
  hasError(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  sanitizeNameInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const sanitizedValue = input.value.replace(this.allowedTextCharactersRegex, '');
    if (sanitizedValue === input.value) return;

    input.value = sanitizedValue;
    this.categoryForm.get('name')?.setValue(sanitizedValue, { emitEvent: false });
  }
}


