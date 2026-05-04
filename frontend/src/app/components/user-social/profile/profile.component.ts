import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, UserDTO } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: UserDTO | null = null;
  profileForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  testEmailLoading = false;
  testEmailMessage = '';
  isEditing = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      photoUrl: ['']
    });
  }

  ngOnInit() {
    this.userService.getMyProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.profileForm.patchValue({
          username: data.username,
          email: data.email,
          photoUrl: data.photoUrl || ''
        });
      },
      error: () => this.errorMessage = 'Unable to load profile'
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.updateMyProfile(this.profileForm.value).subscribe({
      next: () => {
        this.userService.getMyProfile().subscribe(updated => {
          this.user = updated;
          this.profileForm.patchValue({
            username: updated.username,
            email: updated.email,
            photoUrl: updated.photoUrl || ''
          });

          const cachedUser = this.authService.getCurrentUser();
          if (cachedUser) {
            this.authService.updateCurrentUser({
              ...cachedUser,
              username: updated.username,
              email: updated.email,
            });
          }
        });

        this.loading = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.errorMessage = 'Error while updating profile';
        this.loading = false;
      }
    });
  }

  sendTestEmail() {
    if (!this.user || !this.user.email) {
      this.testEmailMessage = 'No email available for user';
      return;
    }

    this.testEmailLoading = true;
    this.testEmailMessage = '';
    this.userService.sendTestEmail(this.user.email, 'SMGO: Test Email', 'This is a test email sent from your profile.').subscribe({
      next: () => {
        this.testEmailLoading = false;
        this.testEmailMessage = 'Test email sent to ' + this.user!.email;
        setTimeout(() => this.testEmailMessage = '', 5000);
      },
      error: (err) => {
        this.testEmailLoading = false;
        this.testEmailMessage = 'Failed to send test email';
        console.error(err);
      }
    });
  }
}
