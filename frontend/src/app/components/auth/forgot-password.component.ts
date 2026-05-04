import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../services/validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
        <p class="text-gray-600 mb-6">Reset your password with your account email</p>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              formControlName="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter your account email"
            />
            <div *ngIf="getFieldErrors('email')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('email') }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              formControlName="newPassword"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter a new password"
            />
            <div *ngIf="getFieldErrors('newPassword')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('newPassword') }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Confirm your new password"
            />
            <div *ngIf="getFieldErrors('confirmPassword')" class="text-red-500 text-sm mt-1">
              {{ getFieldErrors('confirmPassword') }}
            </div>
          </div>

          <div *ngIf="errorMessage" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
          </div>

          <button
            type="submit"
            [disabled]="!forgotForm.valid || isLoading"
            class="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <p class="text-center text-gray-600 mt-6">
          Back to
          <a routerLink="/auth/login" class="text-indigo-500 hover:text-indigo-700 font-semibold">Login</a>
        </p>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email, CustomValidators.noLeadingTrailingWhitespace]],
        newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
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

  getFieldErrors(fieldName: string): string {
    const field = this.forgotForm.get(fieldName);
    if (!field || !field.invalid || !field.touched) {
      return '';
    }

    const errors = field.errors;
    if (errors) {
      if (errors['required']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be empty`;
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['minlength']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${errors['minlength'].requiredLength} characters`;
      if (errors['maxlength']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${errors['maxlength'].requiredLength} characters`;
      if (errors['passwordMismatch']) return 'Passwords do not match';
      if (errors['leadingTrailingWhitespace']) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot have leading or trailing spaces`;
    }

    if (fieldName === 'confirmPassword' && this.forgotForm.hasError('passwordMismatch') && field.touched) {
      return 'Passwords do not match';
    }

    return '';
  }

  onSubmit(): void {
    if (!this.forgotForm.valid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({
      email: this.forgotForm.value.email,
      newPassword: this.forgotForm.value.newPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Password reset successful. Redirecting to login...';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 1200);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Password reset failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
