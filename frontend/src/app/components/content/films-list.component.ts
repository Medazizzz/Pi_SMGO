import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  X,
  Loader,
} from 'lucide-angular';
import { ContentService, FilmDTO, PageResponseDTO } from '../../services/api.service';
import { CustomValidators } from '../../services/validators';

/**
 * Films List Component
 * WHY: Displays all films with pagination, search, and filtering
 * Allows users to view, create, edit, and delete films
 */
@Component({
  selector: 'app-films-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-900 text-white p-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Films Management</h1>
        <p class="text-gray-400">Manage your film collection</p>
      </div>

      <!-- Search and Filter Bar -->
      <div class="bg-gray-800 rounded-lg p-4 mb-6">
        <div class="flex gap-4 flex-wrap">
          <!-- Search Input -->
          <div class="flex-1 min-w-[200px]">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search films..."
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <!-- Filter Button -->
          <button
            (click)="toggleFilters()"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition"
          >
            <span class="w-5 h-5"></span>
            Filters
          </button>

          <!-- Create Button -->
          <button
            (click)="openCreateForm()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition"
          >
            <span class="w-5 h-5"></span>
            New Film
          </button>
        </div>

        <!-- Filters (Collapsible) -->
        <div *ngIf="showFilters" class="mt-4 pt-4 border-t border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <select
                [(ngModel)]="selectedCategory"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Categories</option>
                <option *ngFor="let cat of categoryOptions" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- Sort By -->
            <div>
              <label class="block text-sm font-medium mb-2">Sort By</label>
              <select
                [(ngModel)]="sortBy"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="title">Title</option>
                <option value="releaseDate">Release Date</option>
                <option value="director">Director</option>
              </select>
            </div>

            <!-- Sort Direction -->
            <div>
              <label class="block text-sm font-medium mb-2">Direction</label>
              <select
                [(ngModel)]="sortDirection"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center items-center py-12">
        <span class="w-8 h-8 animate-spin"></span>
        <span class="ml-2">Loading films...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="bg-red-900/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
        {{ error() }}
      </div>

      <!-- Films Grid -->
      <div *ngIf="!loading() && films().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div *ngFor="let film of films()" class="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition">
          <!-- Film Poster Placeholder -->
          <div class="bg-gradient-to-br from-blue-600 to-purple-600 h-48 flex items-center justify-center">
            <span class="text-gray-300">{{ film.title }}</span>
          </div>

          <!-- Film Info -->
          <div class="p-4">
            <h3 class="text-lg font-bold mb-2 truncate">{{ film.title }}</h3>
            <p class="text-gray-400 text-sm mb-3 line-clamp-2">{{ film.description }}</p>

            <!-- Film Details -->
            <div class="space-y-1 text-sm mb-4">
              <p><span class="text-gray-400">Director:</span> {{ film.director }}</p>
              <p><span class="text-gray-400">Duration:</span> {{ film.durationInMinutes }} min</p>
              <p><span class="text-gray-400">Category:</span> {{ film.category }}</p>
              <p *ngIf="film.releaseDate" class="text-gray-400">
                <span>Released:</span> {{ film.releaseDate }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                (click)="viewFilm(film)"
                class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <span class="w-4 h-4"></span>
                View
              </button>
              <button
                (click)="editFilm(film)"
                class="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <span class="w-4 h-4"></span>
                Edit
              </button>
              <button
                (click)="deleteFilm(film.id)"
                class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <span class="w-4 h-4"></span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && films().length === 0" class="text-center py-12">
        <p class="text-gray-400 text-lg">No films found</p>
        <button
          (click)="openCreateForm()"
          class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Create First Film
        </button>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading() && films().length > 0" class="flex justify-between items-center mt-8">
        <div class="text-gray-400">
          Showing {{ (currentPage() * pageSize()) + 1 }} to {{ Math.min((currentPage() + 1) * pageSize(), totalElements()) }} of {{ totalElements() }}
        </div>
        <div class="flex gap-2">
          <button
            (click)="previousPage()"
            [disabled]="currentPage() === 0"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition"
          >
            Previous
          </button>
          <div class="flex items-center gap-2">
            <span class="text-gray-400">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          </div>
          <button
            (click)="nextPage()"
            [disabled]="currentPage() >= totalPages() - 1"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showForm()" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">{{ editingId() ? 'Edit Film' : 'Create New Film' }}</h2>
            <button (click)="closeForm()" class="text-gray-400 hover:text-white">
              <span class="w-6 h-6"></span>
            </button>
          </div>

          <form [formGroup]="filmForm" (ngSubmit)="saveFilm()" class="space-y-4">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                formControlName="title"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Film title"
              />
              <div *ngIf="getFieldError('title')" class="text-red-400 text-sm mt-1">
                {{ getFieldError('title') }}
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-2">Description</label>
              <textarea
                formControlName="description"
                rows="3"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Film description"
              ></textarea>
            </div>

            <!-- Director -->
            <div>
              <label class="block text-sm font-medium mb-2">Director *</label>
              <input
                type="text"
                formControlName="director"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Director name"
              />
              <div *ngIf="getFieldError('director')" class="text-red-400 text-sm mt-1">
                {{ getFieldError('director') }}
              </div>
            </div>

            <!-- Duration -->
            <div>
              <label class="block text-sm font-medium mb-2">Duration (minutes) *</label>
              <input
                type="number"
                formControlName="durationInMinutes"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="120"
              />
              <div *ngIf="getFieldError('durationInMinutes')" class="text-red-400 text-sm mt-1">
                {{ getFieldError('durationInMinutes') }}
              </div>
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium mb-2">Category *</label>
              <select
                formControlName="category"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option *ngFor="let cat of categoryOptions" [value]="cat">{{ cat }}</option>
              </select>
              <div *ngIf="getFieldError('category')" class="text-red-400 text-sm mt-1">
                {{ getFieldError('category') }}
              </div>
            </div>

            <!-- Release Date -->
            <div>
              <label class="block text-sm font-medium mb-2">Release Date</label>
              <input
                type="date"
                formControlName="releaseDate"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                [disabled]="!filmForm.valid || loading()"
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition font-medium"
              >
                {{ loading() ? 'Saving...' : 'Save Film' }}
              </button>
              <button
                type="button"
                (click)="closeForm()"
                class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FilmsListComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;
  readonly CloseIcon = X;
  readonly LoaderIcon = Loader;
  readonly Math = Math;

  // State
  films = signal<FilmDTO[]>([]);
  readonly categoryOptions: Array<'MOVIE' | 'SERIES' | 'DOCUMENTARY'> = ['MOVIE', 'SERIES', 'DOCUMENTARY'];
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<string | null>(null);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(20);
  totalElements = signal(0);
  totalPages = signal(0);

  // Filters
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'title';
  sortDirection = 'ASC';

  filmForm!: FormGroup;

  constructor(
    private contentService: ContentService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadFilms();
  }

  private initializeForm() {
    this.filmForm = this.fb.group({
      contentType: ['FILM'], // Always FILM for this component
      title: ['', [Validators.required, CustomValidators.minLength(3)]],
      description: ['', [CustomValidators.minLength(10)]],
      director: ['', [Validators.required, CustomValidators.minLength(2)]],
      durationInMinutes: ['', [Validators.required, Validators.min(1), Validators.max(1000)]],
      category: ['MOVIE', Validators.required],
      releaseDate: ['']
    });
  }

  loadFilms() {
    this.loading.set(true);
    this.error.set(null);

    this.contentService.getContentPaginated(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined,
      this.selectedCategory || undefined,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (response: PageResponseDTO<any>) => {
        this.films.set(response.content.filter(c => c.contentType === 'FILM'));
        this.currentPage.set(response.page);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load films: ' + err.message);
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(0);
    this.loadFilms();
  }

  onFilterChange() {
    this.currentPage.set(0);
    this.loadFilms();
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  openCreateForm() {
    this.editingId.set(null);
    this.filmForm.reset();
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.filmForm.reset();
  }

  editFilm(film: FilmDTO) {
    this.editingId.set(film.id || '');
    this.filmForm.patchValue(film);
    this.showForm.set(true);
  }

  viewFilm(film: FilmDTO) {
    // Navigate to detail view
    console.log('View film:', film);
  }

  saveFilm() {
    if (!this.filmForm.valid) {
      Object.keys(this.filmForm.controls).forEach(key => {
        const control = this.filmForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.loading.set(true);
    const filmData: FilmDTO = {
      ...this.filmForm.value,
      contentType: 'FILM'
    } as FilmDTO;

    if (this.editingId()) {
      this.contentService.updateFilm(this.editingId()!, filmData).subscribe({
        next: () => {
          this.closeForm();
          this.loadFilms();
          alert('Film updated successfully!');
        },
        error: (err) => {
          this.error.set('Failed to update film: ' + err.message);
          this.loading.set(false);
        }
      });
    } else {
      this.contentService.createFilm(filmData).subscribe({
        next: () => {
          this.closeForm();
          this.loadFilms();
          alert('Content created successfully!');
        },
        error: (err) => {
          this.error.set('Failed to create content: ' + err.message);
          this.loading.set(false);
        }
      });
    }
  }

  deleteFilm(id: string | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this film?')) {
      this.loading.set(true);
      this.contentService.deleteContent(id).subscribe({
        next: () => {
          this.loadFilms();
          alert('Film deleted successfully!');
        },
        error: (err) => {
          this.error.set('Failed to delete film: ' + err.message);
          this.loading.set(false);
        }
      });
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadFilms();
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadFilms();
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.filmForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['min']) return `${fieldName} must be at least ${errors['min'].min}`;
    if (errors['max']) return `${fieldName} must not exceed ${errors['max'].max}`;

    return 'Invalid value';
  }
}


