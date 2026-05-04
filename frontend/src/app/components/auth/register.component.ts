import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../services/validators';

/**
 * Register Component
 * WHY: Provides user registration interface with validation
 * Includes password matching validation and email verification
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
        <p class="text-gray-600 mb-6">Register to get started</p>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              formControlName="username"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="Choose a username (letters, numbers, _ and - only)"
            />
            <div *ngIf="getFieldErrors('username')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('username') }}
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              formControlName="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="Enter your email"
            />
            <div *ngIf="getFieldErrors('email')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('email') }}
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="Create a strong password"
            />
            <div *ngIf="getFieldErrors('password')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('password') }}
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="Confirm your password"
            />
            <div *ngIf="getFieldErrors('confirmPassword')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('confirmPassword') }}
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="!registerForm.valid || isLoading"
            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {{ isLoading ? 'Creating account...' : 'Register' }}
          </button>
        </form>

        <!-- Login Link -->
        <p class="text-center text-gray-600 mt-6">
          Already have an account?
          <a routerLink="/auth/login" class="text-green-500 hover:text-green-700 font-semibold">Login here</a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize registration form with validation rules
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          CustomValidators.validUsername,
          CustomValidators.noLeadingTrailingWhitespace
        ]],
        email: ['', [
          Validators.required,
          Validators.email,
          CustomValidators.noLeadingTrailingWhitespace
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(128),
          CustomValidators.noLeadingTrailingWhitespace
        ]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /**
   * Custom validator to ensure passwords match
   * WHY: Ensures user enters correct password confirmation
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  /**
   * Get detailed error message for a field
   */
  getFieldErrors(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.invalid || !field.touched) {
      return '';
    }

    const errors = field.errors;
    if (errors) {
      if (errors['required']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be empty`;
      if (errors['minlength']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${errors['minlength'].requiredLength} characters`;
      if (errors['maxlength']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${errors['maxlength'].requiredLength} characters`;
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['invalidUsername']) return 'Username can only contain letters, numbers, underscores, and hyphens';
      if (errors['leadingTrailingWhitespace']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot have leading or trailing spaces`;
      if (errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Check if form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Get password error message
   */
  getPasswordErrorMessage(): string {
    const confirmPassword = this.registerForm.get('confirmPassword');

    if (confirmPassword?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.registerForm.valid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerData = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => {
          // Get user role and redirect accordingly
          const role = (localStorage.getItem('userRole') || '').toUpperCase();
          if (role.includes('ADMIN')) {
            this.router.navigate(['/admin/content']);
          } else {
            this.router.navigate(['/user/home']);
          }
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
