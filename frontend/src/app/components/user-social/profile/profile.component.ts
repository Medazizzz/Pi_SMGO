import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, UserDTO } from '../../../services/user.service';

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
  isEditing = false;

  constructor(
    private userService: UserService,
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
}
