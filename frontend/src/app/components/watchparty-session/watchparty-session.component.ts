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

interface JoinRequest {
  userId: string;
  watchPartyId: string;
  watchPartyTitre: string;
  timestamp: number;
  status: string;
}

@Component({
  selector: 'app-watchparty-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchparty-session.component.html',
  styleUrls: ['./watchparty-session.component.css']
})
export class WatchpartySessionComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  session: any = null;
  loading = true;
  errorMessage = '';
  successMessage = '';
  activeTab: 'members' | 'chat' = 'members';
  chatInput = '';
  chatMessages: ChatMessage[] = [];
  sessionLinkCopied = false;

  approvalStatus: 'waiting' | 'approved' | 'rejected' | 'host' = 'waiting';
  pendingJoinRequests: JoinRequest[] = [];

  private readonly chatKeyPrefix = 'wp_chat_';
  private chatStorageKey = '';

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
  private notifPollTimer: ReturnType<typeof setInterval> | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private storageListener = this.onStorageEvent.bind(this);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly watchpartyService: WatchpartyService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.currentUserId = this.resolveCurrentUserId();
    this.chatStorageKey = `${this.chatKeyPrefix}${this.sessionId}`;

    this.loadChat();
    window.addEventListener('storage', this.storageListener);

    if (!this.sessionId) {
      this.loading = false;
      this.errorMessage = 'Missing watchparty session id.';
      return;
    }

    this.bootstrapSessionAccess();
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
    window.removeEventListener('storage', this.storageListener);
  }

  private clearAllTimers(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    if (this.notifPollTimer) { clearInterval(this.notifPollTimer); this.notifPollTimer = null; }
    if (this.successTimer) { clearTimeout(this.successTimer); this.successTimer = null; }
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  private bootstrapSessionAccess(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        this.loading = false;

        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
          return;
        }

        const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];
        const hostId = data.clientId || data.adminId || '';

        if (this.currentUserId === hostId) {
          this.approvalStatus = 'host';
          this.startSessionPolling();
          this.startJoinRequestPolling();
          return;
        }

        if (participants.includes(this.currentUserId)) {
          this.approvalStatus = 'approved';
          this.startSessionPolling();
          return;
        }

        // Not in session yet → send join request and wait
        this.approvalStatus = 'waiting';

        this.watchpartyService.createJoinRequest(this.sessionId).subscribe({
          next: () => { this.startPollingApproval(); },
          error: () => { this.startPollingApproval(); }
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? 'This WatchParty no longer exists or has been deleted.'
          : 'Unable to load watchparty session.';
      }
    });
  }

  // ─── Leave (removes current user from participants, does NOT delete) ──────

  leaveSession(): void {
    // Call your backend's "remove participant" or "leave" endpoint.
    // Adjust the method name to match your WatchpartyService API.
    this.watchpartyService.leaveWatchParty(this.sessionId).subscribe({
      next: () => {
        this.router.navigate(['/user/watchparty']);
      },
      error: () => {
        // Navigate away even on error to avoid stuck state
        this.router.navigate(['/user/watchparty']);
      }
    });
  }

  // ─── Host: approve / reject join requests ─────────────────────────────────

  approveRequest(request: JoinRequest): void {
    this.watchpartyService.approveJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.pendingJoinRequests = this.pendingJoinRequests.filter(
          (r) => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.loadSession();
        this.showSuccess('✅ User approved and joined the session!');
      },
      error: () => { this.errorMessage = 'Failed to approve request.'; }
    });
  }

  rejectRequest(request: JoinRequest): void {
    this.watchpartyService.rejectJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.pendingJoinRequests = this.pendingJoinRequests.filter(
          (r) => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.showSuccess('❌ Request rejected.');
      },
      error: () => { this.errorMessage = 'Failed to reject request.'; }
    });
  }

  // ─── Polling ──────────────────────────────────────────────────────────────

  private startJoinRequestPolling(): void {
    if (this.notifPollTimer) { clearInterval(this.notifPollTimer); this.notifPollTimer = null; }

    this.notifPollTimer = setInterval(() => {
      this.watchpartyService.getJoinRequests(this.sessionId).subscribe({
        next: (requests: any[]) => {
          this.pendingJoinRequests = (requests || []).filter((r) => r.status === 'pending');
        },
        error: () => { this.pendingJoinRequests = []; }
      });
    }, 2000);
  }

  private startPollingApproval(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }

    this.pollTimer = setInterval(() => {
      this.checkApprovalStatus();
    }, 2000);
  }

  private checkApprovalStatus(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];

        if (participants.includes(this.currentUserId)) {
          if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
          this.approvalStatus = 'approved';
          this.session = data;
          this.startSessionPolling();
          this.showSuccess('You were approved and joined the session.');
          return;
        }

        this.watchpartyService.getJoinRequests(this.sessionId).subscribe({
          next: (requests: any[]) => {
            const myRequest = (requests || []).find((r) => r.userId === this.currentUserId);
            if (myRequest?.status === 'rejected') {
              if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
              this.approvalStatus = 'rejected';
            }
          },
          error: () => {}
        });
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.approvalStatus = 'rejected';
          setTimeout(() => { this.router.navigate(['/user/watchparty']); }, 3000);
        }
      }
    });
  }

  private startSessionPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }

    this.pollTimer = setInterval(() => {
      this.watchpartyService.getById(this.sessionId).subscribe({
        next: (data: any) => { this.session = data; },
        error: () => {}
      });
    }, 10000);
  }

  private loadSession(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
        }
      },
      error: () => {}
    });
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  sendMessage(): void {
    const text = this.chatInput.trim();
    if (!text) { return; }

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.chatMessages.push({
      author: this.currentUserId || 'You',
      initials: (this.currentUserId || 'YO').slice(0, 2).toUpperCase(),
      text,
      time,
      isMe: true
    });

    this.saveChat();
    this.chatInput = '';
    this.scrollChatToBottom();
  }

  private getStoredChat(): ChatMessage[] {
    try { return JSON.parse(localStorage.getItem(this.chatStorageKey) || '[]'); }
    catch { return []; }
  }

  private saveChat(): void {
    localStorage.setItem(this.chatStorageKey, JSON.stringify(this.chatMessages));
  }

  private loadChat(): void {
    this.chatMessages = this.getStoredChat();
    this.scrollChatToBottom();
  }

  private onStorageEvent(event: StorageEvent): void {
    if (event.key === this.chatStorageKey) { this.loadChat(); }
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  // ─── Misc ─────────────────────────────────────────────────────────────────

  copySessionLink(): void {
    const link = `${window.location.origin}/watchparty/${this.sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.sessionLinkCopied = true;
      setTimeout(() => { this.sessionLinkCopied = false; }, 3000);
    });
  }

  /** Navigate away without touching the session data */
  close(): void {
    this.router.navigate(['/user/watchparty']);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    if (this.successTimer) { clearTimeout(this.successTimer); this.successTimer = null; }
    this.successTimer = setTimeout(() => { this.successMessage = ''; }, 4000);
  }

  private resolveCurrentUserId(): string {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) { return String(payload.sub); }
      }
    } catch {}
    return '';
  }
}