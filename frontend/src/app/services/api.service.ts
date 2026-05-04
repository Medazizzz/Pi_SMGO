import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


export interface GenreDTO {
  id?: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ContentDTO {
  id?: string;
  title: string;
  description?: string;
  releaseDate?: string;
  category: 'MOVIE' | 'SERIES' | 'DOCUMENTARY';
  genreIds?: string[];
  addedById?: string;
  addedByUsername?: string;
  contentType: string;
}


export interface FilmDTO extends ContentDTO {
  durationInMinutes: number;
  director: string;
}

export interface SeriesDTO extends ContentDTO {
  numberOfSeasons: number;
  numberOfEpisodes: number;
  isCompleted?: boolean;
}


export interface DocumentaryDTO extends ContentDTO {
  topic: string;
  narrator: string;
}

export interface CategoryDTO {
  id?: string;
  name: string;
  description?: string;
  contentType?: 'MOVIE' | 'SERIES' | 'DOCUMENTARY';
}


export interface NotificationDTO {
  id?: string;
  message: string;
  type?: string;
  isRead?: boolean;
  userId?: string;
  username?: string;
  createdAt?: string;
  title?: string;
  read?: boolean;
}


export interface PageResponseDTO<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Legacy interfaces for backward compatibility
export interface Film extends FilmDTO {}
export interface Series extends SeriesDTO {}
export interface Documentary extends DocumentaryDTO {}
export interface Category extends CategoryDTO {}
export interface Notification extends NotificationDTO {}


@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private contentsBaseUrl = 'http://localhost:8090/api/contents';
  private categoriesBaseUrl = 'http://localhost:8090/api/categories';
  private genresBaseUrl = 'http://localhost:8090/api/genres';
  private notificationsBaseUrl = 'http://localhost:8090/api/notifications';

  constructor(private http: HttpClient) { }

  // ==================== FILMS CRUD ====================

  createFilm(film: FilmDTO): Observable<FilmDTO> {
    return this.http.post<FilmDTO>(`${this.contentsBaseUrl}/films`, film)
      .pipe(
        catchError(error => this.handleError('create', 'Film', error))
      );
  }

  getFilmById(id: string): Observable<FilmDTO> {
    return this.http.get<FilmDTO>(`${this.contentsBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('read', 'Film', error))
      );
  }

  updateFilm(id: string, film: FilmDTO): Observable<FilmDTO> {
    return this.http.put<FilmDTO>(`${this.contentsBaseUrl}/films/${id}`, film)
      .pipe(
        catchError(error => this.handleError('update', 'Film', error))
      );
  }

  // ==================== SERIES CRUD ====================

  createSeries(series: SeriesDTO): Observable<SeriesDTO> {
    return this.http.post<SeriesDTO>(`${this.contentsBaseUrl}/series`, series)
      .pipe(
        catchError(error => this.handleError('create', 'Series', error))
      );
  }

  updateSeries(id: string, series: SeriesDTO): Observable<SeriesDTO> {
    return this.http.put<SeriesDTO>(`${this.contentsBaseUrl}/series/${id}`, series)
      .pipe(
        catchError(error => this.handleError('update', 'Series', error))
      );
  }

  // ==================== DOCUMENTARIES CRUD ====================

  createDocumentary(doc: DocumentaryDTO): Observable<DocumentaryDTO> {
    return this.http.post<DocumentaryDTO>(`${this.contentsBaseUrl}/documentaries`, doc)
      .pipe(
        catchError(error => this.handleError('create', 'Documentary', error))
      );
  }

  updateDocumentary(id: string, doc: DocumentaryDTO): Observable<DocumentaryDTO> {
    return this.http.put<DocumentaryDTO>(`${this.contentsBaseUrl}/documentaries/${id}`, doc)
      .pipe(
        catchError(error => this.handleError('update', 'Documentary', error))
      );
  }

  // ==================== GENERIC CONTENT ====================

  getAllContent(): Observable<ContentDTO[]> {
    return this.http.get<ContentDTO[]>(this.contentsBaseUrl)
      .pipe(
        catchError(error => this.handleError('read', 'Content', error))
      );
  }

  getContentPaginated(
    page: number = 0,
    size: number = 20,
    search?: string,
    categoryId?: string,
    sortBy: string = 'id',
    sortDirection: string = 'ASC'
  ): Observable<PageResponseDTO<ContentDTO>> {
    let url = `${this.contentsBaseUrl}/paginated?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return this.http.get<PageResponseDTO<ContentDTO>>(url)
      .pipe(catchError(error => this.handleError('read', 'Content', error)));
  }

  deleteContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.contentsBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('delete', 'Content', error))
      );
  }

  // ==================== CATEGORIES CRUD ====================

  createCategory(category: CategoryDTO): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(this.categoriesBaseUrl, category)
      .pipe(
        catchError(error => this.handleError('create', 'Category', error))
      );
  }

  getCategoryById(id: string): Observable<CategoryDTO> {
    return this.http.get<CategoryDTO>(`${this.categoriesBaseUrl}/${id}`)
      .pipe(catchError(error => this.handleError('read', 'Category', error)));
  }

  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(this.categoriesBaseUrl)
      .pipe(catchError(error => this.handleError('read', 'Category', error)));
  }

  updateCategory(id: string, category: CategoryDTO): Observable<CategoryDTO> {
    return this.http.put<CategoryDTO>(`${this.categoriesBaseUrl}/${id}`, category)
      .pipe(
        catchError(error => this.handleError('update', 'Category', error))
      );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.categoriesBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('delete', 'Category', error))
      );
  }

  // ==================== NOTIFICATIONS CRUD ====================

  getNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<NotificationDTO[]>(this.notificationsBaseUrl)
      .pipe(catchError(error => this.handleError('read', 'Notifications', error)));
  }

  createNotification(notification: NotificationDTO): Observable<NotificationDTO> {
    return this.http.post<NotificationDTO>(this.notificationsBaseUrl, notification)
      .pipe(
        catchError(error => this.handleError('create', 'Notification', error))
      );
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.notificationsBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('delete', 'Notification', error))
      );
  }

  // ==================== GENRES CRUD ====================

  createGenre(genre: GenreDTO): Observable<GenreDTO> {
    return this.http.post<GenreDTO>(this.genresBaseUrl, genre)
      .pipe(
        catchError(error => this.handleError('create', 'Genre', error))
      );
  }

  getGenreById(id: string): Observable<GenreDTO> {
    return this.http.get<GenreDTO>(`${this.genresBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('read', 'Genre', error))
      );
  }

  getAllGenres(): Observable<GenreDTO[]> {
    return this.http.get<GenreDTO[]>(this.genresBaseUrl)
      .pipe(
        catchError(error => this.handleError('read', 'Genres', error))
      );
  }

  updateGenre(id: string, genre: GenreDTO): Observable<GenreDTO> {
    return this.http.put<GenreDTO>(`${this.genresBaseUrl}/${id}`, genre)
      .pipe(
        catchError(error => this.handleError('update', 'Genre', error))
      );
  }

  deleteGenre(id: string): Observable<void> {
    return this.http.delete<void>(`${this.genresBaseUrl}/${id}`)
      .pipe(
        catchError(error => this.handleError('delete', 'Genre', error))
      );
  }

  // ==================== ERROR HANDLING ====================

  private handleError(operation: string, entity: string, error: HttpErrorResponse) {
    let errorMessage = 'Unknown error occurred';

    // Check if it's a client-side error event
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message || 'Network error occurred';
    } else {
      // Server-side error
      if (error.error?.errors && typeof error.error.errors === 'object') {
        // Handle validation errors
        const fieldErrors = Object.entries(error.error.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        errorMessage = fieldErrors || `HTTP ${error.status}: Field validation failed`;
      } else if (error.error?.details) {
        errorMessage = error.error.details;
      } else if (typeof error.error === 'string' && error.error.trim()) {
        errorMessage = error.error;
      } else if (error.error?.message && error.error.message !== 'An unexpected error occurred') {
        errorMessage = error.error.message;
      } else if (error.status) {
        const statusMessages: { [key: number]: string } = {
          0: 'Network connection error - Backend might be offline',
          400: 'Bad request - Invalid data provided',
          401: 'Unauthorized - Please login first',
          403: 'Forbidden - You do not have permission',
          404: 'Not found',
          500: 'Internal server error',
          503: 'Service unavailable'
        };
        errorMessage = statusMessages[error.status] || `HTTP Error ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    }

    console.error(`Failed to ${operation} ${entity}:`, {
      statusCode: error.status,
      message: errorMessage,
      fullError: error
    });
    return throwError(() => new Error(errorMessage));
  }
}

/**
 * Category Service
 * @deprecated Use ContentService instead
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = 'http://localhost:8090/api/categories';

  constructor(private http: HttpClient) { }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category).pipe(catchError(this.handleError));
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError));
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl).pipe(catchError(this.handleError));
  }

  updateCategory(id: string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, category).pipe(catchError(this.handleError));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      message = `Error: ${error.error.message}`;
    } else {
      message = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(message));
  }
}

/**
 * Notification Service
 * @deprecated Use ContentService instead
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8090/api/notifications';

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<NotificationDTO[]>(this.baseUrl)
      .pipe(catchError(error => this.handleError('read', 'Notifications', error)));
  }

  createNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, notification)
      .pipe(catchError(error => this.handleError('create', 'Notification', error)));
  }

  getNotificationsByUserId(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`)
      .pipe(catchError(error => this.handleError('read', 'Notification', error)));
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {})
      .pipe(catchError(error => this.handleError('update', 'Notification', error)));
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(error => this.handleError('delete', 'Notification', error)));
  }

  private handleError(operation: string, entity: string, error: HttpErrorResponse) {
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message || 'Network error occurred';
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status) {
        const statusMessages: { [key: number]: string } = {
          0: 'Backend offline',
          400: 'Bad request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not found',
          500: 'Server error',
          503: 'Service unavailable'
        };
        errorMessage = statusMessages[error.status] || `HTTP Error ${error.status}`;
      }
    }
    
    console.error(`Failed to ${operation} ${entity}:`, { statusCode: error.status, message: errorMessage, error });
    return throwError(() => new Error(errorMessage));
  }
}
