import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Star,
  Eye,
  Filter,
  Download,
  X,
} from 'lucide-angular';
import { ContentService, ContentDTO, GenreDTO, CategoryDTO } from '../../services/api.service';
import { CustomValidators } from '../../services/validators';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-content.component.html',
  styleUrls: ['./admin-content.component.css'],
})
export class AdminContentComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly StarIcon = Star;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;
  readonly CloseIcon = X;

  searchQuery = signal('');
  filterPlatform = signal('all');
  filterStatus = signal('all');
  contentType = signal<'FILM' | 'SERIES' | 'DOCUMENTARY'>('FILM');

  contentList = signal<(ContentDTO & { platform?: string; genre?: string; rating?: number; views?: number; status?: string; hiddenGem?: boolean; })[]>([]);
  genres = signal<GenreDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  contentForm!: FormGroup;
  submitAttempted = false;
  private readonly allowedTextCharactersRegex = /[^\p{L}\p{N}\s\-']/gu;
  private readonly allowedTextPattern = /^[\p{L}\p{N}\s\-']+$/u;
  private readonly nonDigitRegex = /[^0-9]/g;

  constructor(
    private contentService: ContentService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadGenres();
    this.loadCategories();
    this.loadAllContent();
  }

  loadCategories() {
    this.contentService.getAllCategories().subscribe({
      next: (data) => {
        const normalized = (Array.isArray(data) ? data : [])
          .map((item) => ({
            id: item.id,
            name: (item.name || '').trim(),
            description: item.description || '',
            contentType: item.contentType || 'MOVIE'
          }))
          .filter(item => !!item.id && !!item.name);

        this.categories.set(normalized);

        // Ensure selector has a value in create mode.
        if (!this.editingId() && !this.contentForm.get('selectedCategoryId')?.value && normalized.length > 0) {
          this.contentForm.patchValue({ selectedCategoryId: normalized[0].id }, { emitEvent: true });
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadGenres() {
    this.contentService.getAllGenres().subscribe({
      next: (data) => {
        this.genres.set(data);
      },
      error: (err) => {
        console.error('Error loading genres:', err);
        this.error.set('Failed to load genres');
      }
    });
  }

  initializeForm() {
    this.contentForm = this.fb.group({
      title: ['', [
        Validators.required,
        CustomValidators.minLength(3),
        CustomValidators.maxLength(255),
        CustomValidators.noSpecialCharacters,
        CustomValidators.noLeadingTrailingWhitespace
      ]],
      description: ['', [
        Validators.required,
        CustomValidators.minLength(10),
        CustomValidators.maxLength(1000),
        CustomValidators.noLeadingTrailingWhitespace
      ]],
      releaseDate: ['', [Validators.required, CustomValidators.pastDateValidator]],
      category: ['MOVIE', Validators.required],
      selectedCategoryId: ['', Validators.required],
      contentType: ['FILM', Validators.required],
      genreIds: [[], [Validators.required]],  // At least one genre is required
      // Film fields
      durationInMinutes: [null],
      director: ['', [
        CustomValidators.noSpecialCharacters,
        Validators.pattern(this.allowedTextPattern),
        CustomValidators.noLeadingTrailingWhitespace
      ]],
      // Series fields
      numberOfSeasons: [null],
      numberOfEpisodes: [null],
      isCompleted: [false],
      // Documentary fields
      topic: ['', [
        CustomValidators.noSpecialCharacters,
        CustomValidators.noLeadingTrailingWhitespace
      ]],
      narrator: ['', [
        CustomValidators.noSpecialCharacters,
        CustomValidators.noLeadingTrailingWhitespace
      ]],
    });

    // Listen to content type changes to update validators
    this.contentForm.get('contentType')?.valueChanges.subscribe(type => {
      this.updateConditionalValidators(type);
    });

    this.contentForm.get('selectedCategoryId')?.valueChanges.subscribe((categoryId: string) => {
      const selected = this.categories().find(c => c.id === categoryId);
      const enumType = (selected?.contentType === 'SERIES' || selected?.contentType === 'DOCUMENTARY')
        ? selected.contentType
        : 'MOVIE';

      const contentTypeValue = enumType === 'MOVIE' ? 'FILM' : enumType;

      this.contentForm.patchValue({ category: enumType, contentType: contentTypeValue }, { emitEvent: false });
      this.contentType.set(contentTypeValue as 'FILM' | 'SERIES' | 'DOCUMENTARY');
      this.updateConditionalValidators(contentTypeValue);
    });

    // Set initial validators
    this.updateConditionalValidators('FILM');
  }

  private updateConditionalValidators(contentType: string) {
    const durationControl = this.contentForm.get('durationInMinutes');
    const directorControl = this.contentForm.get('director');
    const seasonsControl = this.contentForm.get('numberOfSeasons');
    const episodesControl = this.contentForm.get('numberOfEpisodes');
    const topicControl = this.contentForm.get('topic');
    const narratorControl = this.contentForm.get('narrator');

    // Clear all conditional validators first
    [durationControl, directorControl, seasonsControl, episodesControl, topicControl, narratorControl].forEach(ctrl => {
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });

    // Set validators based on content type
    if (contentType === 'FILM') {
      durationControl?.setValidators([
        Validators.required,
        Validators.min(1),
        CustomValidators.positiveInteger
      ]);
      directorControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        CustomValidators.noSpecialCharacters,
        Validators.pattern(this.allowedTextPattern),
        CustomValidators.noLeadingTrailingWhitespace
      ]);
    } else if (contentType === 'SERIES') {
      seasonsControl?.setValidators([
        Validators.required,
        Validators.min(1),
        CustomValidators.positiveInteger
      ]);
      episodesControl?.setValidators([
        Validators.required,
        Validators.min(1),
        CustomValidators.positiveInteger
      ]);
    } else if (contentType === 'DOCUMENTARY') {
      topicControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        CustomValidators.noSpecialCharacters,
        CustomValidators.noLeadingTrailingWhitespace
      ]);
      narratorControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        CustomValidators.noSpecialCharacters,
        CustomValidators.noLeadingTrailingWhitespace
      ]);
    }

    [durationControl, directorControl, seasonsControl, episodesControl, topicControl, narratorControl].forEach(ctrl => {
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  loadAllContent() {
    this.loading.set(true);
    this.error.set(null);
    this.contentService.getAllContent().subscribe({
      next: (data) => {
        // Map genre IDs to genre objects for display
        const enhancedData = data.map(item => {
          const genreNames = (item.genreIds || []).map(id => this.getGenreName(id));
          return {
            ...item,
            platform: item.category || 'Unknown',
            genres: genreNames,
            genre: genreNames.length > 0 ? genreNames[0] : 'Unknown',
            rating: 0,
            views: 0,
            status: 'active',
            hiddenGem: false,
          };
        });
        this.contentList.set(enhancedData);
        this.loading.set(false);
      },
      error: (err) => {
        const errorMsg = err?.message || 'Failed to connect to server';
        this.error.set('Failed to load content: ' + errorMsg);
        this.loading.set(false);
        console.error('Error loading content:', err);
      },
    });
  }

  openForm() {
    this.submitAttempted = false;
    this.editingId.set(null);
    this.contentType.set('FILM');
    this.initializeForm();
    this.contentForm.reset({
      category: 'MOVIE',
      contentType: 'FILM',
      selectedCategoryId: this.categories()[0]?.id || '',
      isCompleted: false
    });
    this.showForm.set(true);
  }

  closeForm() {
    this.submitAttempted = false;
    this.showForm.set(false);
    this.editingId.set(null);
    this.contentForm.reset();
  }

  editContent(content: any) {
    this.submitAttempted = false;
    this.editingId.set(content.id || '');
    
    // Determine content type from the data
    let contentType = content.contentType || 'FILM';
    if (contentType === 'FILM' && content.durationInMinutes === undefined && content.numberOfSeasons !== undefined) {
      contentType = 'SERIES';
    } else if (contentType === 'FILM' && content.topic !== undefined) {
      contentType = 'DOCUMENTARY';
    }
    
    this.contentType.set(contentType as any);
    
    // Reset form with new content type validators
    this.initializeForm();
    this.updateConditionalValidators(contentType);
    
    // Map category enum value - handle both old and new formats
    const categoryValue = content.category || (
      contentType === 'SERIES' ? 'SERIES' : 
      contentType === 'DOCUMENTARY' ? 'DOCUMENTARY' : 
      'MOVIE'
    );
    
    // Patch the form with existing values
    const matchingCategory = this.categories().find(c => c.contentType === categoryValue);

    this.contentForm.patchValue({
      title: content.title,
      description: content.description,
      releaseDate: this.toDateInputValue(content.releaseDate),
      category: categoryValue,
      selectedCategoryId: matchingCategory?.id || this.categories()[0]?.id || '',
      contentType: contentType,
      genreIds: content.genreIds ?? [],
      durationInMinutes: content.durationInMinutes ?? null,
      director: content.director ?? '',
      numberOfSeasons: content.numberOfSeasons ?? null,
      numberOfEpisodes: content.numberOfEpisodes ?? null,
      isCompleted: content.isCompleted ?? false,
      topic: content.topic ?? '',
      narrator: content.narrator ?? '',
    }, { emitEvent: false });
    
    this.showForm.set(true);
  }

  private toDateInputValue(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }

      // HTML date input expects yyyy-MM-dd
      if (trimmed.length >= 10) {
        return trimmed.substring(0, 10);
      }

      return trimmed;
    }

    if (value instanceof Date) {
      return value.toISOString().substring(0, 10);
    }

    return '';
  }

  saveContent() {
    this.submitAttempted = true;

    if (!this.contentForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contentForm.controls).forEach(key => {
        const control = this.contentForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const id = this.editingId();
    const formData = {
      ...this.contentForm.value,
      contentType: this.contentForm.get('contentType')?.value
    };

    if (id) {
      this.updateContent(id, formData);
    } else {
      this.createContent(formData);
    }
  }

  private isFieldRequired(fieldName: string): boolean {
    const control = this.contentForm.get(fieldName);
    return control?.hasError('required') || false;
  }

  createContent(data: ContentDTO) {
    this.loading.set(true);
    const type = this.contentType();

    // Filter data to only include relevant fields for the content type
    let filteredData: any = {
      title: data.title,
      description: data.description,
      releaseDate: data.releaseDate,
      category: data.category,
      genreIds: data.genreIds || [],
    };

    // Add type-specific fields
    const formData = data as any;
    if (type === 'FILM') {
      filteredData.durationInMinutes = formData.durationInMinutes;
      filteredData.director = formData.director;
    } else if (type === 'SERIES') {
      filteredData.numberOfSeasons = formData.numberOfSeasons;
      filteredData.numberOfEpisodes = formData.numberOfEpisodes;
      filteredData.isCompleted = formData.isCompleted;
    } else if (type === 'DOCUMENTARY') {
      filteredData.topic = formData.topic;
      filteredData.narrator = formData.narrator;
    }

    // Select appropriate service method based on content type
    let request$: Observable<ContentDTO>;
    if (type === 'FILM') {
      request$ = this.contentService.createFilm(filteredData as any);
    } else if (type === 'SERIES') {
      request$ = this.contentService.createSeries(filteredData as any);
    } else {
      request$ = this.contentService.createDocumentary(filteredData as any);
    }

    request$.subscribe({
      next: (response: ContentDTO) => {
        const enrichedResponse = {
          ...response,
          contentType: type,
          platform: response.category || 'Unknown',
          genres: (response.genreIds || []).map(id => this.getGenreName(id)),
          genre: 'Unknown',
          rating: 0,
          views: 0,
          status: 'active',
          hiddenGem: false,
        };
        this.contentList.set([...this.contentList(), enrichedResponse]);
        this.closeForm();
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        let errorMessage = `Failed to create ${type.toLowerCase()}`;
        if (err.message) {
          errorMessage += ': ' + err.message;
        }
        this.error.set(errorMessage);
        console.error(`Error creating ${type.toLowerCase()}:`, err);
      },
    });
  }

  updateContent(id: string, data: ContentDTO) {
    this.loading.set(true);
    const type = this.contentType();

    // Filter data to only include relevant fields for the content type
    let filteredData: any = {
      title: data.title,
      description: data.description,
      releaseDate: data.releaseDate,
      category: data.category,
      genreIds: data.genreIds || [],
    };

    // Add type-specific fields
    const formData = data as any;
    if (type === 'FILM') {
      filteredData.durationInMinutes = formData.durationInMinutes;
      filteredData.director = formData.director;
    } else if (type === 'SERIES') {
      filteredData.numberOfSeasons = formData.numberOfSeasons;
      filteredData.numberOfEpisodes = formData.numberOfEpisodes;
      filteredData.isCompleted = formData.isCompleted;
    } else if (type === 'DOCUMENTARY') {
      filteredData.topic = formData.topic;
      filteredData.narrator = formData.narrator;
    }

    // Select appropriate service method based on content type
    let request$: Observable<ContentDTO>;
    if (type === 'FILM') {
      request$ = this.contentService.updateFilm(id, filteredData as any);
    } else if (type === 'SERIES') {
      request$ = this.contentService.updateSeries(id, filteredData as any);
    } else {
      request$ = this.contentService.updateDocumentary(id, filteredData as any);
    }

    request$.subscribe({
      next: (response: ContentDTO) => {
        const enrichedResponse = {
          ...response,
          contentType: type,
          platform: response.category || 'Unknown',
          genres: (response.genreIds || []).map(id => this.getGenreName(id)),
          genre: 'Unknown',
          rating: 0,
          views: 0,
          status: 'active',
          hiddenGem: false,
        };
        const updated = this.contentList().map(item =>
          item.id === id ? enrichedResponse : item
        );
        this.contentList.set(updated);
        this.closeForm();
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        let errorMessage = `Failed to update ${type.toLowerCase()}`;
        if (err.message) {
          errorMessage += ': ' + err.message;
        }
        this.error.set(errorMessage);
        console.error(`Error updating ${type.toLowerCase()}:`, err);
      },
    });
  }

  deleteContent(id: string | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this content?')) {
      this.loading.set(true);
      this.contentService.deleteContent(id).subscribe({
        next: () => {
          this.contentList.set(this.contentList().filter(item => item.id !== id));
          this.loading.set(false);
        },
        error: (err: any) => {
          this.loading.set(false);
          let errorMessage = 'Failed to delete content';
          if (err.message) {
            errorMessage = err.message;
          }
          this.error.set(errorMessage);
          console.error('Error deleting content:', err);
        },
      });
    }
  }

  get content(): any[] {
    return this.contentList();
  }

  get filteredContent(): any[] {
    return this.content.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesPlatform = this.filterPlatform() === 'all' || item.platform === this.filterPlatform();
      const matchesStatus = this.filterStatus() === 'all' || item.status === this.filterStatus();
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }

  get activeCount(): number {
    return this.content.filter((c) => c.status === 'active').length;
  }

  get hiddenGemsCount(): number {
    return this.content.filter((c) => c.hiddenGem).length;
  }

  get averageRating(): number {
    if (this.content.length === 0) return 0;
    const total = this.content.reduce((sum, c) => sum + (c.rating || 0), 0);
    return Math.round((total / this.content.length) * 10) / 10;
  }

  toggleGenre(genre: GenreDTO) {
    const genreIdsControl = this.contentForm.get('genreIds');
    if (!genreIdsControl || !genre.id) return;

    const currentGenreIds = genreIdsControl.value || [];
    if (currentGenreIds.includes(genre.id)) {
      genreIdsControl.setValue(currentGenreIds.filter((id: string) => id !== genre.id));
    } else {
      genreIdsControl.setValue([...currentGenreIds, genre.id]);
    }
  }

  isGenreSelected(genreId?: string): boolean {
    if (!genreId) return false;
    const genreIdsControl = this.contentForm.get('genreIds');
    const currentGenreIds = genreIdsControl?.value || [];
    return currentGenreIds.includes(genreId);
  }

  getGenreName(genreId: string): string {
    const genre = this.genres().find(g => g.id === genreId);
    return genre?.name || 'Unknown Genre';
  }

  sanitizeDirectorInput(event: Event) {
    this.sanitizeTextInput(event, 'director');
  }

  sanitizeTitleInput(event: Event) {
    this.sanitizeTextInput(event, 'title');
  }

  sanitizeTopicInput(event: Event) {
    this.sanitizeTextInput(event, 'topic');
  }

  sanitizeNarratorInput(event: Event) {
    this.sanitizeTextInput(event, 'narrator');
  }

  sanitizePositiveIntegerInput(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const sanitizedValue = input.value.replace(this.nonDigitRegex, '');
    if (sanitizedValue === input.value) return;

    input.value = sanitizedValue;
    this.contentForm.get(fieldName)?.setValue(sanitizedValue, { emitEvent: false });
  }

  private sanitizeTextInput(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const sanitizedValue = input.value.replace(this.allowedTextCharactersRegex, '');
    if (sanitizedValue === input.value) return;

    input.value = sanitizedValue;
    this.contentForm.get(fieldName)?.setValue(sanitizedValue, { emitEvent: false });
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      releaseDate: 'Release date',
      selectedCategoryId: 'Category',
      genreIds: 'Genres',
      durationInMinutes: 'Duration',
      director: 'Director',
      numberOfSeasons: 'Number of seasons',
      numberOfEpisodes: 'Number of episodes',
      topic: 'Topic',
      narrator: 'Narrator'
    };

    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.contentForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty || this.submitAttempted));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500 border-green-500';
      case 'hidden':
        return 'bg-gray-500/20 text-gray-400 border-gray-400';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-500 border-blue-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400';
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.contentForm.get(fieldName);
    if (!control || !control.errors || !(control.touched || control.dirty || this.submitAttempted)) return '';

    const errors = control.errors;
    const label = this.getFieldLabel(fieldName);

    if (errors['required']) return `${label} is required`;
    if (errors['minlength']) return `${label} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${label} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['specialCharacters']) return `${label} cannot contain special characters`;
    if (errors['pattern']) return `${label} contains invalid characters`;
    if (errors['leadingTrailingWhitespace']) return `${label} cannot start or end with spaces`;
    if (errors['numeric']) return `${label} must be a valid number`;
    if (errors['positiveInteger']) return `${label} must be a positive whole number`;
    if (errors['min']) return `${label} must be at least ${errors['min'].min}`;
    if (errors['minvalue']) return `${label} must be at least ${errors['minvalue'].min}`;
    if (errors['pastdate']) return `${label} cannot be in the future`;

    return 'Invalid value';
  }
}



