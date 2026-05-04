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
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="logo"></div>
        <div>
          <h2>ShowMatchGoOn</h2>
          <p>Your Entertainment Hub</p>
        </div>
      </div>

      <h1>Create Account</h1>
      <p class="subtitle">Register to start your movie experience</p>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <label>Username</label>
        <input type="text" formControlName="username" placeholder="Choose a username" />
        <div *ngIf="getFieldErrors('username')" class="error">
          {{ getFieldErrors('username') }}
        </div>

        <label>Email</label>
        <input type="email" formControlName="email" placeholder="Enter your email" />
        <div *ngIf="getFieldErrors('email')" class="error">
          {{ getFieldErrors('email') }}
        </div>

        <label>Password</label>
        <input type="password" formControlName="password" placeholder="Create a password" />
        <div *ngIf="getFieldErrors('password')" class="error">
          {{ getFieldErrors('password') }}
        </div>

        <label>Confirm Password</label>
        <input type="password" formControlName="confirmPassword" placeholder="Confirm your password" />
        <div *ngIf="getFieldErrors('confirmPassword')" class="error">
          {{ getFieldErrors('confirmPassword') }}
        </div>

        <div *ngIf="errorMessage" class="error-box">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-box">
          {{ successMessage }}
        </div>

        <button type="submit" [disabled]="!registerForm.valid || isLoading">
          {{ isLoading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="register">
        Already have an account?
        <a routerLink="/auth/login">Login here</a>
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
    width: 460px;
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

  .brand p {
    margin: 3px 0 0;
    color: #a1a1aa;
  }

  h1 {
    margin: 0;
    font-size: 42px;
    font-weight: 800;
  }

  .subtitle {
    color: #a1a1aa;
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

  .forgot {
    align-self: flex-end;
    color: #f472b6;
    text-decoration: none;
    margin-bottom: 22px;
    font-weight: 600;
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
    transition: 0.25s;
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(236, 72, 153, 0.25);
  }

  button:disabled {
    background: #374151;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .register {
    text-align: center;
    color: #a1a1aa;
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
`]
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
