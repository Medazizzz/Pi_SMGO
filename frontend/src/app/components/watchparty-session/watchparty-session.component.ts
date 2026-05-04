import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WatchpartyService } from '../../services/watchparty.service';

interface ChatMessage {
  author: string;
  initials: string;
  text: string;
  time: string;
  isMe: boolean;
}

@Component({
  selector: 'app-watchparty-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchparty-session.component.html',
  styleUrls: ['./watchparty-session.component.css']
})
export class WatchpartySessionComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  session: any = null;
  loading = true;
  errorMessage = '';
  successMessage = '';
  activeTab: 'members' | 'chat' = 'members';
  chatInput = '';
  chatMessages: ChatMessage[] = [];
  sessionLinkCopied = false;

  approvalStatus: 'waiting' | 'approved' | 'rejected' | 'host' = 'host';
  pendingUserId: string | null = null;

  memberColors = [
    { bg: 'rgba(124,92,252,0.25)', text: '#a78bfa' },
    { bg: 'rgba(34,211,160,0.2)', text: '#22d3a0' },
    { bg: 'rgba(251,146,60,0.2)', text: '#fb923c' },
    { bg: 'rgba(239,68,68,0.2)', text: '#f87171' },
    { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa' }
  ];

  private sessionId = '';
  private currentUserId = '';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly responseKey = 'wp_join_responses';
  private readonly requestKey = 'wp_join_requests';
  private readonly userStorageKey = 'wp_current_user_id';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly watchpartyService: WatchpartyService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.currentUserId = this.resolveCurrentUserId();

    if (!this.sessionId) {
      this.loading = false;
      this.errorMessage = 'Missing watchparty session id.';
      return;
    }

    this.bootstrapSessionAccess();
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
  }

  private loadSession(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        this.loading = false;

        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? 'This WatchParty no longer exists or has been deleted.'
          : 'Unable to load watchparty session.';
      }
    });
  }

  private bootstrapSessionAccess(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        this.loading = false;

        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
          return;
        }

        const creatorId = localStorage.getItem(`wp_creator_${this.sessionId}`);
        const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];

        if (creatorId && creatorId === this.currentUserId) {
          this.approvalStatus = 'host';
          this.startSessionPolling();
          return;
        }

        if (participants.includes(this.currentUserId)) {
          this.approvalStatus = 'approved';
          this.startSessionPolling();
          return;
        }

        this.pendingUserId = this.currentUserId;
        this.approvalStatus = 'waiting';
        this.ensurePendingJoinRequest(data);
        this.startPollingApproval();
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? 'This WatchParty no longer exists or has been deleted.'
          : 'Unable to load watchparty session.';
      }
    });
  }

  private startPollingApproval(): void {
    this.pollTimer = setInterval(() => {
      try {
        const responses = JSON.parse(localStorage.getItem(this.responseKey) || '[]');
        const myResponse = responses.find(
          (r: any) => r.userId === this.pendingUserId && r.watchPartyId === this.sessionId
        );

        if (!myResponse) {
          this.loadSession();
          return;
        }

        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }

        if (myResponse.status === 'approved') {
          this.approvalStatus = 'approved';
          this.watchpartyService.join(this.sessionId, this.pendingUserId ?? undefined).subscribe({
            next: () => {
              this.loadSession();
              this.startSessionPolling();
              this.showSuccess('You were approved and joined the session.');
            },
            error: () => {
              this.errorMessage = 'Error while joining approved session.';
            }
          });
        } else {
          this.approvalStatus = 'rejected';
        }

        const cleaned = responses.filter(
          (r: any) => !(r.userId === this.pendingUserId && r.watchPartyId === this.sessionId)
        );
        localStorage.setItem(this.responseKey, JSON.stringify(cleaned));
      } catch {
        this.loadSession();
      }
    }, 3000);
  }

  private ensurePendingJoinRequest(session: any): void {
    const request = {
      userId: this.currentUserId,
      watchPartyId: this.sessionId,
      watchPartyTitre: session?.titre || 'WatchParty',
      timestamp: Date.now(),
      status: 'pending'
    };

    const requests = this.getStoredRequests();
    const alreadyPending = requests.some(
      (r: any) => r.userId === request.userId && r.watchPartyId === request.watchPartyId && r.status === 'pending'
    );

    if (!alreadyPending) {
      requests.push(request);
      localStorage.setItem(this.requestKey, JSON.stringify(requests));
    }
  }

  private getStoredRequests(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.requestKey) || '[]');
    } catch {
      return [];
    }
  }

  private resolveCurrentUserId(): string {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenUserId = payload.sub || payload.userId || payload.id;
        if (tokenUserId) {
          return String(tokenUserId);
        }
      }
    } catch {
      // Fallback handled below.
    }

    const existing = localStorage.getItem(this.userStorageKey);
    if (existing && existing.trim()) {
      return existing;
    }

    const generated = `user_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(this.userStorageKey, generated);
    return generated;
  }

  private startSessionPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollTimer = setInterval(() => {
      this.watchpartyService.getById(this.sessionId).subscribe({
        next: (data: any) => {
          this.session = data;
        },
        error: () => {
          // Keep the current screen stable if one refresh fails.
        }
      });
    }, 10000);
  }

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) {
      return;
    }

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    this.chatMessages.push({
      author: 'You',
      initials: 'YO',
      text,
      time,
      isMe: true
    });
    this.chatInput = '';

    setTimeout(() => {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  copySessionLink(): void {
    const link = `${window.location.origin}/watchparty/${this.sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.sessionLinkCopied = true;
      setTimeout(() => {
        this.sessionLinkCopied = false;
      }, 3000);
    });
  }

  close(): void {
    this.router.navigate(['/user/watchparty']);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
    this.successTimer = setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }
}
