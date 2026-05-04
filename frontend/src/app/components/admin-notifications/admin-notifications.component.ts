import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Bell, Mail, MessageSquare, Send, Edit2, Trash2, X } from 'lucide-angular';
import { ContentService, NotificationService, NewsletterCampaignDTO } from '../../services/api.service';
import { CustomValidators } from '../../services/validators';

export interface Notification {
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

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.css'],
})
export class AdminNotificationsComponent implements OnInit {
  readonly BellIcon = Bell;
  readonly MailIcon = Mail;
  readonly MessageSquareIcon = MessageSquare;
  readonly SendIcon = Send;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly CloseIcon = X;

  notifications: Notification[] = [];
  newsletterCampaigns: NewsletterCampaignDTO[] = [];
  loading = false;
  newsletterLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  newsletterError: string | null = null;
  showForm = false;
  showNewsletterForm = false;
  editingId: string | null = null;
  testEmailAddress = '';
  testEmailSubject = 'SMGO Test Email';
  testEmailBody = 'This is a test email from SMGO.';
  testEmailLoading = false;
  testEmailMessage = '';
  notificationForm!: FormGroup;
  newsletterForm!: FormGroup;
  currentUserId = '';

  constructor(
    private contentService: ContentService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.initializeNewsletterForm();
  }

  ngOnInit() {
    this.currentUserId = this.resolveCurrentUserId();
    this.loadNotifications();
    this.loadNewsletterCampaigns();
  }

  initializeForm() {
    this.notificationForm = this.fb.group({
      title: ['', [Validators.required, CustomValidators.minLength(3), CustomValidators.maxLength(100)]],
      message: ['', [Validators.required, CustomValidators.minLength(10), CustomValidators.maxLength(500)]],
    });
  }

  initializeNewsletterForm() {
    this.newsletterForm = this.fb.group({
      title: ['', [Validators.required, CustomValidators.minLength(3), CustomValidators.maxLength(120)]],
      message: ['', [Validators.required, CustomValidators.minLength(10), CustomValidators.maxLength(1000)]],
      scheduledAt: ['', [Validators.required]],
      targetCategory: [''],
      targetGenres: [''],
      sendEmail: [true],
    });
  }

  loadNotifications() {
    this.loading = true;
    this.error = null;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = (data || []).map(item => this.normalizeNotification(item));
        this.loading = false;
        console.log(`✓ Loaded ${data.length} notification(s)`);
      },
      error: (err) => {
        this.error = 'Failed to load notifications';
        this.loading = false;
        console.error('Error loading notifications:', err);
      },
    });
  }

  loadNewsletterCampaigns() {
    this.newsletterLoading = true;
    this.newsletterError = null;
    this.notificationService.getNewsletterCampaigns().subscribe({
      next: (data) => {
        this.newsletterCampaigns = data || [];
        this.newsletterLoading = false;
      },
      error: (err) => {
        this.newsletterError = 'Failed to load newsletter campaigns';
        this.newsletterLoading = false;
        console.error('Error loading newsletter campaigns:', err);
      },
    });
  }

  openForm() {
    this.editingId = null;
    this.notificationForm.reset();
    this.showForm = true;
  }

  openNewsletterForm() {
    this.newsletterForm.reset({
      sendEmail: true,
    });
    this.showNewsletterForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.notificationForm.reset();
  }

  closeNewsletterForm() {
    this.showNewsletterForm = false;
    this.newsletterForm.reset({
      sendEmail: true,
    });
  }

  saveNotification() {
    if (!this.notificationForm.valid) {
      Object.keys(this.notificationForm.controls).forEach(key => {
        const control = this.notificationForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const formData = {
      message: this.notificationForm.value.message,
      title: this.notificationForm.value.title,
      type: 'INFO',
      isRead: false,
    };

    this.broadcastNotification(formData);
  }

  saveNewsletterCampaign() {
    if (!this.newsletterForm.valid) {
      Object.keys(this.newsletterForm.controls).forEach(key => {
        const control = this.newsletterForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    const targetGenres = String(this.newsletterForm.value.targetGenres || '')
      .split(',')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);

    const scheduledAtValue = this.newsletterForm.value.scheduledAt;
    const scheduledAtLocal = scheduledAtValue ? String(scheduledAtValue).slice(0, 16) : new Date().toISOString().slice(0, 16);

    const payload: NewsletterCampaignDTO = {
      title: this.newsletterForm.value.title,
      message: this.newsletterForm.value.message,
      scheduledAt: scheduledAtLocal,
      targetCategory: this.newsletterForm.value.targetCategory || undefined,
      targetGenres,
      sendEmail: !!this.newsletterForm.value.sendEmail,
    };

    this.newsletterLoading = true;
    this.newsletterError = null;
    this.notificationService.createNewsletterCampaign(payload).subscribe({
      next: (response) => {
        this.newsletterCampaigns.unshift(response);
        this.closeNewsletterForm();
        this.newsletterLoading = false;
      },
      error: (err) => {
        this.newsletterError = 'Failed to schedule newsletter';
        this.newsletterLoading = false;
        console.error('Error creating newsletter campaign:', err);
      },
    });
  }

  dispatchNewsletterCampaign(id: string) {
    this.newsletterLoading = true;
    this.notificationService.dispatchNewsletterCampaign(id).subscribe({
      next: (updated) => {
        this.newsletterCampaigns = this.newsletterCampaigns.map(campaign => campaign.id === id ? updated : campaign);
        this.newsletterLoading = false;
      },
      error: (err) => {
        this.newsletterError = 'Failed to dispatch newsletter';
        this.newsletterLoading = false;
        console.error('Error dispatching newsletter campaign:', err);
      },
    });
  }

  createNotification(data: Notification) {
    this.loading = true;
    this.notificationService.createNotification(data).subscribe({
      next: (response) => {
        this.notifications.unshift(this.normalizeNotification(response));
        this.closeForm();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to send notification';
        this.loading = false;
        console.error('Error sending notification:', err);
      },
    });
  }

  broadcastNotification(data: Notification) {
    this.loading = true;
    this.error = null;
    this.contentService.broadcastNotification(data).subscribe({
      next: (response) => {
        console.log('Broadcast notification sent successfully:', response);
        // Add a representative notification to the admin view
        const adminNotification = {
          ...data,
          id: response.id,
          createdAt: new Date().toISOString(),
          isRead: false,
          read: false,
          userId: 'BROADCAST',
          username: 'All Users'
        };
        this.notifications.unshift(this.normalizeNotification(adminNotification));
        this.closeForm();
        this.loading = false;
        // Show success message
        this.successMessage = `Notification broadcasted to all users successfully!`;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.error = 'Failed to broadcast notification';
        this.loading = false;
        console.error('Error broadcasting notification:', err);
      },
    });
  }

  sendCustomTestEmail() {
    const email = this.testEmailAddress.trim();
    const subject = this.testEmailSubject.trim();
    const body = this.testEmailBody.trim();

    if (!email) {
      this.error = 'Recipient email is required for a test email.';
      return;
    }

    this.testEmailLoading = true;
    this.testEmailMessage = '';
    this.error = null;

    this.notificationService.sendTestEmail(email, subject || undefined, body || undefined).subscribe({
      next: () => {
        this.testEmailMessage = `Test email sent to ${email}`;
        this.testEmailLoading = false;
        setTimeout(() => {
          this.testEmailMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.error = 'Failed to send custom test email';
        this.testEmailLoading = false;
        console.error('Error sending custom test email:', err);
      },
    });
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
          notif.isRead = true;
          notif.read = true;
        }
      },
      error: (err) => {
        console.error('Error marking as read:', err);
      },
    });
  }

  deleteNotification(id: string) {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.loading = true;
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to delete notification';
          this.loading = false;
          console.error('Error deleting notification:', err);
        },
      });
    }
  }

  isNotificationRead(notif: Notification): boolean {
    return !!(notif.isRead ?? notif.read ?? false);
  }

  private normalizeNotification(notification: Notification): Notification {
    const message = (notification.message || '').trim();
    const title = (notification.title || '').trim();
    const type = (notification.type || '').trim().toUpperCase();
    const inferredTitle = this.inferTitle(message, type);

    return {
      ...notification,
      title: title || inferredTitle,
      message,
      isRead: notification.isRead ?? notification.read ?? false,
      read: notification.read ?? notification.isRead ?? false
    };
  }

  private inferTitle(message: string, type: string): string {
    const colonIndex = message.indexOf(':');
    if (colonIndex > 0) {
      return message.substring(0, colonIndex).trim();
    }

    if (type) {
      return `${type.charAt(0)}${type.substring(1).toLowerCase()} Notification`;
    }

    return 'Notification';
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !(n.isRead ?? n.read ?? false)).length;
  }

  get sentThisWeek(): number {
    return this.notifications.length;
  }

  clearCustomTestEmail(): void {
    this.testEmailAddress = '';
    this.testEmailSubject = 'SMGO Test Email';
    this.testEmailBody = 'This is a test email from SMGO.';
    this.testEmailMessage = '';
    this.error = null;
  }

  getFieldError(fieldName: string): string {
    const control = this.notificationForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;

    return 'Invalid value';
  }

  getNewsletterFieldError(fieldName: string): string {
    const control = this.newsletterForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;

    return 'Invalid value';
  }

  getNewsletterSummary(campaign: NewsletterCampaignDTO): string {
    const pieces: string[] = [];
    if (campaign.targetCategory) pieces.push(`Category: ${campaign.targetCategory}`);
    if (campaign.targetGenres?.length) pieces.push(`Genres: ${campaign.targetGenres.join(', ')}`);
    if (!pieces.length) pieces.push('All active users');
    return pieces.join(' | ');
  }

  private resolveCurrentUserId(): string {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.userId) {
          return String(parsed.userId);
        }
      } catch {
        // Continue with fallback.
      }
    }
    return 'admin';
  }
}


