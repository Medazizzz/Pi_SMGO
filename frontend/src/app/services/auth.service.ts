import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Authentication Response Model
 * WHY: Strongly typed response from backend authentication endpoints
 */
export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
  userId: string;
  role?: string;
  roles?: string[];
}

/**
 * Authentication Request Model
 */
export interface AuthRequest {
  username: string;
  password: string;
  email?: string;
}

export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
}

/**
 * Current User Model
 */
export interface CurrentUser {
  username: string;
  userId: string;
  email: string;
}

/**
 * Authentication Service
 * WHY: Centralized authentication management for login, register, and token handling
 * Manages JWT token storage and user session
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8090/api/auth';
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if token exists on service initialization
    this.checkAuthentication();
  }

  /**
   * Register new user
   * WHY: Creates account and automatically logs in user
   * @param authRequest Registration data
   * @returns Observable<AuthResponse>
   */
  register(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, authRequest)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
          alert('Account created successfully. Welcome!');
        }),
        catchError(error => {
          const message = error.error?.message || 'Registration failed';
          alert(`Registration failed: ${message}`);
          return this.handleError(error);
        })
      );
  }

  /**
   * Login user
   * WHY: Authenticates user and stores token for subsequent API calls
   * @param authRequest Login credentials
   * @returns Observable<AuthResponse>
   */
  login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, authRequest)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
          alert('Logged in successfully');
        }),
        catchError(error => {
          const message = error.error?.message || 'Login failed';
          alert(`Login failed: ${message}`);
          return this.handleError(error);
        })
      );
  }

  /**
   * Reset password using email and a new password
   * WHY: Allows users to recover account access when they forget their password
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/forgot-password`, request, { responseType: 'text' })
      .pipe(
        catchError(error => {
          const message = error.error?.message || error.error || 'Password reset failed';
          alert(`Password reset failed: ${message}`);
          return this.handleError(error);
        })
      );
  }

  /**
   * Handle successful authentication response
   * WHY: Stores token, updates user state, and notifies subscribers
   * @param response Authentication response from backend
   */
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    
    // Determine user role - prioritize 'role' field, then 'roles' array
    let userRole = response.role || 'USER';
    if (response.roles && response.roles.length > 0) {
      userRole = response.roles[0];
    }
    
    localStorage.setItem('userRole', userRole);
    
    const currentUser: CurrentUser = {
      username: response.username,
      userId: response.userId,
      email: response.email
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    this.currentUserSubject.next(currentUser);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Logout user
   * WHY: Clears authentication state and stored data
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Check if user is authenticated
   * @returns true if token exists
   */
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Check authentication status on service init
   * WHY: Restores user session if token exists
   */
  private checkAuthentication(): void {
    if (this.hasToken()) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  /**
   * Get stored JWT token
   * @returns JWT token or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get current user
   * @returns Current user or null
   */
  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }
  getCurrentUserId(): string {
  return this.currentUserSubject.value?.userId || '';
}

  /**
   * Error handling
   * WHY: Consistent error handling across auth methods
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    console.error('Auth Error Details:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      type: typeof error.error
    });
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message || 'Network error occurred';
    } else {
      // Server-side error - try to extract message from response body
      if (error.error && typeof error.error === 'object') {
        // Try common error response patterns
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error.description) {
          errorMessage = error.error.description;
        } else {
          // Use status code to provide friendly message
          switch (error.status) {
            case 401:
            case 403:
              errorMessage = 'Invalid username or password';
              break;
            case 404:
              errorMessage = 'Service not found';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later';
              break;
            default:
              errorMessage = error.statusText || 'Authentication failed';
          }
        }
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        // Fallback based on HTTP status
        switch (error.status) {
          case 401:
          case 403:
            errorMessage = 'Invalid username or password';
            break;
          case 0:
            errorMessage = 'Unable to connect to server. Is the backend running?';
            break;
          default:
            errorMessage = error.statusText || 'Unknown error occurred';
        }
      }
    }
    
    // Ensure we have a message
    if (!errorMessage || errorMessage === '') {
      errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
    }
    
    console.error('Auth Error Message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
