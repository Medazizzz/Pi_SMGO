import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserCog, Users, Award, TrendingUp } from 'lucide-angular';
import { UserService, UserDTO } from '../../services/user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
export class AdminUsersComponent implements OnInit {

  // Icons
  readonly UserCogIcon = UserCog;
  readonly UsersIcon = Users;
  readonly AwardIcon = Award;
  readonly TrendingUpIcon = TrendingUp;

  // Data
  users: UserDTO[] = [];
  loading = false;
  errorMessage = '';

  // Edit
  editingUserId: string | null = null;
  editForm: { username: string; email: string } = {
    username: '',
    email: ''
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();

    // 🔥 BONUS: auto refresh every 5s
    setInterval(() => this.loadUsers(), 5000);
  }

  // =========================
  // LOAD USERS
  // =========================
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (data: UserDTO[]) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to load users.';
        this.loading = false;
      }
    });
  }

  // =========================
  // STATS
  // =========================
  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((u) => !u.blocked).length;
  }

  get adminUsers(): number {
    return this.users.filter((u) =>
      (u.role || '').toUpperCase().includes('ADMIN')
    ).length;
  }

  get regularUsers(): number {
    return this.totalUsers - this.adminUsers;
  }

  // =========================
  // FIDELITY HELPERS 🔥
  // =========================
  getLevelColor(level: string | undefined): string {
    switch ((level || '').toUpperCase()) {
      case 'VIP':
        return 'purple';
      case 'GOLD':
        return 'gold';
      case 'SILVER':
        return 'silver';
      default:
        return 'bronze';
    }
  }

  // =========================
  // EDIT USER
  // =========================
  startEdit(user: UserDTO): void {
    this.editingUserId = user.id;
    this.editForm = {
      username: user.username,
      email: user.email
    };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editForm = { username: '', email: '' };
  }

  saveEdit(): void {
    if (!this.editingUserId) return;

    const username = this.editForm.username.trim();
    const email = this.editForm.email.trim();

    if (!username || !email) {
      this.errorMessage = 'Username and email are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.userService.updateUser(this.editingUserId, {
      username,
      email
    }).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadUsers();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to update user.';
        this.loading = false;
      }
    });
  }

  // =========================
  // DELETE USER
  // =========================
  removeUser(user: UserDTO): void {
    if (!user.id) return;

    if (!confirm(`Delete user ${user.username}?`)) return;

    this.loading = true;
    this.errorMessage = '';

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Unable to delete user.';
        this.loading = false;
      }
    });
  }
}