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
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="logo"></div>
        <div>
          <h2>ShowMatchGoOn</h2>
          <p>Your Entertainment Hub</p>
        </div>
      </div>

      <h1>Forgot Password</h1>
      <p class="subtitle">Reset your password and continue your movie experience</p>

      <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
        <label>Email</label>
        <input type="email" formControlName="email" placeholder="Enter your account email" />
        <div *ngIf="getFieldErrors('email')" class="error">
          {{ getFieldErrors('email') }}
        </div>

        <label>New Password</label>
        <input type="password" formControlName="newPassword" placeholder="Enter a new password" />
        <div *ngIf="getFieldErrors('newPassword')" class="error">
          {{ getFieldErrors('newPassword') }}
        </div>

        <label>Confirm Password</label>
        <input type="password" formControlName="confirmPassword" placeholder="Confirm your new password" />
        <div *ngIf="getFieldErrors('confirmPassword')" class="error">
          {{ getFieldErrors('confirmPassword') }}
        </div>

        <div *ngIf="errorMessage" class="error-box">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-box">
          {{ successMessage }}
        </div>

        <button type="submit" [disabled]="!forgotForm.valid || isLoading">
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <p class="register">
        Back to
        <a routerLink="/auth/login">Login</a>
      </p>
    </div>
  </div>
`,
styles: [`
  .login-page {
    min-height: 100vh;
    background: #080b12;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    color: white;
  }

  .login-page::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.28), transparent 35%),
      radial-gradient(circle at 80% 10%, rgba(236, 72, 153, 0.25), transparent 35%);
  }

  .login-card {
    position: relative;
    width: 480px;
    max-width: 100%;
    padding: 42px;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(8, 11, 18, 0.96));
    border: 1px solid rgba(168, 85, 247, 0.28);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 34px;
  }

  .logo {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
  }

  .brand h2 {
    margin: 0;
    font-size: 25px;
    color: #d946ef;
  }

  .brand p,
  .subtitle,
  .register {
    color: #a1a1aa;
  }

  h1 {
    margin: 0;
    font-size: 38px;
    font-weight: 800;
  }

  .subtitle {
    margin: 10px 0 30px;
    font-size: 16px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  label {
    color: #e5e7eb;
    font-weight: 600;
    margin-bottom: 8px;
  }

  input {
    height: 54px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(15, 23, 42, 0.9);
    color: white;
    padding: 0 18px;
    font-size: 16px;
    margin-bottom: 18px;
    outline: none;
  }

  input:focus {
    border-color: #ec4899;
    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.15);
  }

  button {
    height: 56px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    color: white;
    font-size: 17px;
    font-weight: 800;
    cursor: pointer;
  }

  button:disabled {
    background: #374151;
    cursor: not-allowed;
  }

  .register {
    text-align: center;
    margin-top: 28px;
  }

  .register a {
    color: #f472b6;
    font-weight: 700;
    text-decoration: none;
  }

  .error {
    color: #fb7185;
    margin-top: -10px;
    margin-bottom: 12px;
    font-size: 13px;
  }

  .error-box {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fecaca;
    padding: 12px;
    border-radius: 14px;
    margin-bottom: 18px;
  }

  .success-box {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.4);
    color: #bbf7d0;
    padding: 12px;
    border-radius: 14px;
    margin-bottom: 18px;
  }
`]
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
