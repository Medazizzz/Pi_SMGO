import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Bell, X, Check, Clock } from 'lucide-angular';
import { NotificationService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  timestamp?: number;
  isBroadcast?: boolean;
}

@Component({
  selector: 'app-user-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <!-- Notification Bell Button -->
      <button
        (click)="toggleNotifications()"
        class="relative bg-[#141920] border border-[#8B5CF6]/20 hover:border-[#8B5CF6] rounded-lg p-3 transition-all"
        [class.ring-2]="hasUnreadNotifications()"
        [class.ring-[#8B5CF6]/50]="hasUnreadNotifications()"
      >
        <span class="w-5 h-5 text-[#8B5CF6]"></span>
        <span
          *ngIf="unreadCount() > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ unreadCount() > 9 ? '9+' : unreadCount() }}
        </span>
      </button>

      <!-- Notifications Panel -->
      <div
        *ngIf="showNotifications()"
        class="bg-[#141920] border border-[#8B5CF6]/20 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        style="width: 400px;"
      >
        <div class="p-4 border-b border-[#8B5CF6]/20">
          <div class="flex items-center justify-between">
            <h3 class="text-white font-semibold">Notifications</h3>
            <button (click)="toggleNotifications()" class="text-gray-400 hover:text-white">
              <span class="w-4 h-4"></span>
            </button>
          </div>
          <p class="text-sm text-gray-400 mt-1">{{ notifications().length }} notification(s)</p>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div *ngIf="notifications().length === 0" class="p-4 text-center text-gray-400">
            No notifications yet
          </div>

          <div
            *ngFor="let notification of notifications()"
            class="p-4 border-b border-[#8B5CF6]/10 hover:bg-[#8B5CF6]/5 transition-colors"
            [class.bg-[#8B5CF6]/10]="!notification.isRead"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   [class.bg-blue-500/20]="notification.type === 'INFO'"
                   [class.bg-green-500/20]="notification.type === 'SUCCESS'"
                   [class.bg-yellow-500/20]="notification.type === 'WARNING'"
                   [class.bg-red-500/20]="notification.type === 'ERROR'">
                <span class="w-4 h-4 text-[#8B5CF6]"></span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h4 class="text-white text-sm font-medium truncate">{{ notification.title }}</h4>
                    <p class="text-gray-300 text-sm mt-1">{{ notification.message }}</p>
                    <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span class="w-3 h-3"></span>
                      {{ formatTime(notification.createdAt) }}
                      <span *ngIf="notification.isBroadcast" class="ml-2 px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded">Broadcast</span>
                    </p>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      *ngIf="!notification.isRead"
                      (click)="markAsRead(notification.id)"
                      class="p-1 text-gray-400 hover:text-green-400 transition-colors"
                      title="Mark as read"
                    >
                      <span class="w-4 h-4"></span>
                    </button>
                    <button
                      (click)="deleteNotification(notification.id)"
                      class="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete notification"
                    >
                      <span class="w-4 h-4"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-[#8B5CF6]/20">
          <button
            (click)="markAllAsRead()"
            [disabled]="unreadCount() === 0"
            class="w-full px-3 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class UserNotificationsComponent implements OnInit, OnDestroy {
  readonly BellIcon = Bell;
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly ClockIcon = Clock;

  notifications = signal<UserNotification[]>([]);
  showNotifications = signal(false);
  stompClient: any;
  currentUserId = '';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.userId || '';
    this.loadNotifications();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  loadNotifications(): void {
    if (!this.currentUserId) return;

    this.notificationService.getNotificationsByUserId(this.currentUserId).subscribe({
      next: (data) => {
        const normalized = (data || []).map(item => this.normalizeNotification(item));
        this.notifications.set(normalized);
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  connectWebSocket(): void {
    const socket = new SockJS('http://localhost:8090/ws-watchparty');
    this.stompClient = Stomp.Stomp.over(socket);

    this.stompClient.connect({}, () => {
      console.log('Connected to WebSocket for notifications');

      // Subscribe to broadcast notifications
      this.stompClient.subscribe('/topic/notifications', (message: any) => {
        const notification = JSON.parse(message.body);
        console.log('Received broadcast notification:', notification);
        this.handleNewNotification(notification);
      });
    }, (error: any) => {
      console.error('WebSocket connection error:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.connectWebSocket(), 5000);
    });
  }

  disconnectWebSocket(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect();
    }
  }

  handleNewNotification(notificationData: any): void {
    const newNotification: UserNotification = {
      id: notificationData.id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'INFO',
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: notificationData.timestamp,
      isBroadcast: notificationData.isBroadcast || false
    };

    // Add to the beginning of the list
    this.notifications.update(current => [newNotification, ...current]);

    // Auto-show notifications panel for new broadcasts
    if (newNotification.isBroadcast) {
      this.showNotifications.set(true);
    }
  }

  toggleNotifications(): void {
    this.showNotifications.update(current => !current);
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(current =>
          current.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications().filter(n => !n.isRead);
    unreadNotifications.forEach(notification => {
      this.markAsRead(notification.id);
    });
  }

  deleteNotification(id: string): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications.update(current => current.filter(n => n.id !== id));
      },
      error: (err) => {
        console.error('Error deleting notification:', err);
      }
    });
  }

  hasUnreadNotifications(): boolean {
    return this.unreadCount() > 0;
  }

  unreadCount(): number {
    return this.notifications().filter(n => !n.isRead).length;
  }

  private normalizeNotification(item: any): UserNotification {
    return {
      id: item.id,
      title: item.title || 'Notification',
      message: item.message,
      type: item.type || 'INFO',
      isRead: item.isRead || item.read || false,
      createdAt: item.createdAt,
      isBroadcast: item.isBroadcast || false
    };
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}