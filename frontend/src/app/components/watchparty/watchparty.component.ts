import { Component, Input, OnChanges, OnDestroy, OnInit, Output, EventEmitter, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { WatchpartyService } from '../../services/watchparty.service';

@Component({
  selector: 'app-watchparty',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './watchparty.component.html',
  styleUrls: ['./watchparty.component.css']
})
export class WatchPartyComponent implements OnInit, OnChanges, OnDestroy {

  @Input() mode: 'user' | 'admin' = 'user';
  @Output() onOpenSession = new EventEmitter<string>();

  titre = '';
  contenuId = '';
  list: any[] = [];
  errorMessage = '';
  successMessage = '';

  createdWatchPartyId: string | null = null;
  inviteLink = '';
  linkCopied = false;

  pendingRequests: { userId: string; watchPartyId: string; watchPartyTitre: string; timestamp: number; status?: string }[] = [];

  private service = inject(WatchpartyService);
  private router = inject(Router);
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly storageKey = 'wp_join_requests';
  private readonly responseKey = 'wp_join_responses';
  private readonly userStorageKey = 'wp_current_user_id';
  private currentUserId = '';

  ngOnInit(): void {
    this.mode = this.router.url.includes('/admin/') ? 'admin' : 'user';
    this.currentUserId = this.resolveCurrentUserId();
    this.load();
    this.startPollingRequests();
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.load();
    }
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (data: any[]) => {
        this.list = data;
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'Unable to load watch parties.';
      }
    });
  }

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.createdWatchPartyId = null;
    this.linkCopied = false;

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload = {
      titre: this.titre.trim(),
      contenuId: this.contenuId.trim()
    };

    this.service.add(payload).subscribe({
      next: (created) => {
        this.successMessage = 'WatchParty created successfully.';
        this.createdWatchPartyId = created?.id ?? null;
        if (created?.id) {
          this.inviteLink = `${window.location.origin}/watchparty/${created.id}`;
          localStorage.setItem(`wp_creator_${created.id}`, this.currentUserId);
        }
        form.resetForm();
        this.titre = '';
        this.contenuId = '';
        if (created?.id) {
          this.router.navigate(['/watchparty', created.id]);
        }
        this.load();

        setTimeout(() => {
          this.createdWatchPartyId = null;
          this.linkCopied = false;
        }, 30000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to create watch party.';
      }
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.inviteLink).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    });
  }

  closeInvite(): void {
    this.createdWatchPartyId = null;
    this.linkCopied = false;
  }

  joinWatchParty(watchParty: any): void {
    this.successMessage = '';
    this.errorMessage = '';

    const request = {
      userId: this.currentUserId,
      watchPartyId: watchParty.id,
      watchPartyTitre: watchParty.titre,
      timestamp: Date.now(),
      status: 'pending'
    };

    const existing = this.getStoredRequests();
    const alreadyPending = existing.find(
      (r) => r.userId === this.currentUserId && r.watchPartyId === watchParty.id
    );
    if (!alreadyPending) {
      existing.push(request);
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
    }

    this.router.navigate(['/watchparty', watchParty.id], {
      queryParams: { pending: this.currentUserId }
    });
  }

  leaveWatchParty(id: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.service.leave(id, this.currentUserId).subscribe({
      next: () => {
        this.successMessage = 'Left session successfully.';
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to leave session.';
      }
    });
  }

  deleteWatchParty(id: string): void {
    if (!confirm('Delete this watch party?')) {
      return;
    }

    this.service.delete(id).subscribe({
      next: () => {
        this.successMessage = 'WatchParty deleted successfully.';
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to delete watch party.';
      }
    });
  }

  approveRequest(request: any): void {
    this.service.join(request.watchPartyId, request.userId).subscribe({
      next: () => {
        const responses = this.getStoredResponses();
        responses.push({
          userId: request.userId,
          watchPartyId: request.watchPartyId,
          status: 'approved',
          timestamp: Date.now()
        });
        localStorage.setItem(this.responseKey, JSON.stringify(responses));
        this.markRequestHandled(request);
        this.load();
      },
      error: () => {
        this.errorMessage = 'Failed to approve request.';
      }
    });
  }

  rejectRequest(request: any): void {
    const responses = this.getStoredResponses();
    responses.push({
      userId: request.userId,
      watchPartyId: request.watchPartyId,
      status: 'rejected',
      timestamp: Date.now()
    });
    localStorage.setItem(this.responseKey, JSON.stringify(responses));
    this.markRequestHandled(request);
  }

  private startPollingRequests(): void {
    this.pollTimer = setInterval(() => {
      if (this.mode !== 'user') {
        this.pendingRequests = [];
        return;
      }

      const requests = this.getStoredRequests();
      this.pendingRequests = requests.filter((r) => {
        const creatorId = localStorage.getItem(`wp_creator_${r.watchPartyId}`);
        return creatorId === this.currentUserId && r.status === 'pending';
      });
    }, 3000);
  }

  private getStoredRequests(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  private getStoredResponses(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.responseKey) || '[]');
    } catch {
      return [];
    }
  }

  private markRequestHandled(request: any): void {
    const existing = this.getStoredRequests();
    const updated = existing.map((r) =>
      r.userId === request.userId && r.watchPartyId === request.watchPartyId
        ? { ...r, status: 'handled' }
        : r
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.pendingRequests = this.pendingRequests.filter(
      (r) => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
    );
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
        // Continue with next strategy.
      }
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenUserId = payload.userId || payload.id || payload.sub;
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

  openSession(id: string): void {
    this.router.navigate(['/watchparty', id]);
  }
}
