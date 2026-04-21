import {
  Component, Input, OnChanges, OnDestroy, OnInit,
  Output, EventEmitter, SimpleChanges, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { WatchpartyService } from '../../services/watchparty.service';

interface JoinRequestItem {
  userId: string;
  watchPartyId: string;
  watchPartyTitre: string;
  timestamp: number;
  status?: string;
}

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

  contents: any[] = [];
  filteredContents: any[] = [];
  searchQuery = '';
  selectedContent: any = null;
  showDropdown = false;

  list: any[] = [];
  originalList: any[] = [];

  errorMessage = '';
  successMessage = '';

  createdWatchPartyId: string | null = null;
  inviteLink = '';
  linkCopied = false;

  waitingForApproval = false;
  waitingWatchParty: any = null;
  joinRejected = false;
  private waitingWatchPartyId: string | null = null;

  hostPendingRequests: JoinRequestItem[] = [];
  myJoinRequests: JoinRequestItem[] = [];

  newRequestToast = false;
  private previousPendingCount = 0;

  advancedSearchKeyword = '';
  isSearching = false;
  isSearchMode = false;

  private service = inject(WatchpartyService);
  private http = inject(HttpClient);
  private router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private approvalPollTimer: ReturnType<typeof setInterval> | null = null;
  private dropdownTimer: ReturnType<typeof setTimeout> | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  currentUserId = '';
  private readonly contentApiUrl = 'http://localhost:8090/api/contents';

  ngOnInit(): void {
    this.mode = this.router.url.includes('/admin/') ? 'admin' : 'user';
    this.currentUserId = this.resolveCurrentUserId();
    this.load();
    this.loadContents();
    this.startPollingRequests();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.approvalPollTimer) {
      clearInterval(this.approvalPollTimer);
      this.approvalPollTimer = null;
    }

    if (this.dropdownTimer) {
      clearTimeout(this.dropdownTimer);
      this.dropdownTimer = null;
    }

    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Content search
  // ────────────────────────────────────────────────────────────────────────────

  loadContents(): void {
    this.http.get<any[]>(this.contentApiUrl).subscribe({
      next: (data) => {
        this.contents = data || [];
      },
      error: () => {
        console.warn('Could not load contents list.');
      }
    });
  }

  searchContents(): void {
    const q = this.searchQuery.toLowerCase().trim();

    if (q.length < 2) {
      this.filteredContents = [];
      this.showDropdown = false;
      return;
    }

    this.filteredContents = this.contents.filter(
      c => c.title?.toLowerCase().includes(q)
    );
    this.showDropdown = true;
  }

  selectContent(content: any): void {
    this.selectedContent = content;
    this.contenuId = content.id;
    this.searchQuery = content.title;
    this.showDropdown = false;
  }

  clearContent(): void {
    this.selectedContent = null;
    this.contenuId = '';
    this.searchQuery = '';
    this.showDropdown = false;
  }

  hideDropdownDelayed(): void {
    this.dropdownTimer = setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Load list
  // ────────────────────────────────────────────────────────────────────────────

  load(): void {
    this.service.getAll().subscribe({
      next: (data: any[]) => {
        const all = data || [];

        this.originalList = this.mode === 'admin'
          ? all
          : all.filter((wp: any) => this.shouldShowInUserList(wp));

        if (!this.isSearchMode) {
          this.list = [...this.originalList];
        }

        this.errorMessage = '';
        this.refreshJoinRequestsState();
      },
      error: () => {
        this.errorMessage = 'Unable to load watch parties.';
      }
    });
  }

  private shouldShowInUserList(watchParty: any): boolean {
    return (
      this.isHost(watchParty) ||
      this.isParticipant(watchParty) ||
      this.isActiveWatchParty(watchParty)
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Advanced search
  // ────────────────────────────────────────────────────────────────────────────

  searchWatchParties(): void {
    const keyword = this.advancedSearchKeyword.trim();

    if (!keyword) {
      this.clearAdvancedSearch();
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.service.searchWatchParties(keyword).subscribe({
      next: (results: any[]) => {
        this.isSearchMode = true;

        this.list = (results || []).map((item: any) => ({
          id: item.watchPartyId,
          titre: item.titre,
          statut: item.statut,
          clientId: item.hostId,
          adminId: item.hostId,
          hostUsername: item.hostUsername,
          participantIds: Array.from(
            { length: item.participantCount || 0 },
            (_, i) => `p${i}`
          ),
          feedbackCount: item.feedbackCount || 0,
          matchedFeedbackComment: item.matchedFeedbackComment || '',
          matchedSentiment: item.matchedSentiment || '',
          isSearchResult: true
        }));

        this.isSearching = false;
        this.refreshJoinRequestsState();
      },
      error: () => {
        this.isSearching = false;
        this.errorMessage = 'Advanced search failed.';
      }
    });
  }

  clearAdvancedSearch(): void {
    this.advancedSearchKeyword = '';
    this.isSearching = false;
    this.isSearchMode = false;
    this.list = [...this.originalList];
    this.errorMessage = '';
    this.refreshJoinRequestsState();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Create
  // ────────────────────────────────────────────────────────────────────────────

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.createdWatchPartyId = null;
    this.linkCopied = false;

    if (form.invalid || !this.selectedContent) {
      form.control.markAllAsTouched();
      if (!this.selectedContent) {
        this.errorMessage = 'Please select a content.';
      }
      return;
    }

    const payload = {
      titre: this.titre.trim(),
      contenuId: this.contenuId
    };

    this.service.add(payload).subscribe({
      next: (created) => {
        this.showSuccess('WatchParty created successfully.');
        this.createdWatchPartyId = created?.id ?? null;

        if (created?.id) {
          this.inviteLink = `${window.location.origin}/watchparty/${created.id}`;
        }

        form.resetForm();
        this.titre = '';
        this.contenuId = '';
        this.clearContent();

        this.isSearchMode = false;
        this.load();

        setTimeout(() => {
          this.createdWatchPartyId = null;
          this.linkCopied = false;
        }, 30000);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error?.error ||
          'Failed to create watch party.';
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

  // ────────────────────────────────────────────────────────────────────────────
  // Join flow
  // ────────────────────────────────────────────────────────────────────────────

  joinWatchParty(watchParty: any): void {
    if (!this.canJoin(watchParty)) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.joinRejected = false;

    this.service.createJoinRequest(watchParty.id).subscribe({
      next: () => {
        this.waitingForApproval = true;
        this.waitingWatchParty = watchParty;
        this.waitingWatchPartyId = watchParty.id;

        this.upsertMyJoinRequest({
          userId: this.currentUserId,
          watchPartyId: watchParty.id,
          watchPartyTitre: watchParty.titre,
          timestamp: Date.now(),
          status: 'pending'
        });

        this.startPollingApproval(watchParty.id);
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to send join request.';
      }
    });
  }

  private startPollingApproval(watchPartyId: string): void {
    if (this.approvalPollTimer) {
      clearInterval(this.approvalPollTimer);
      this.approvalPollTimer = null;
    }

    this.approvalPollTimer = setInterval(() => {
      this.service.getById(watchPartyId).subscribe({
        next: (data: any) => {
          const participants: string[] = Array.isArray(data.participantIds)
            ? data.participantIds
            : [];

          if (participants.includes(this.currentUserId)) {
            this.stopApprovalPolling();
            this.waitingForApproval = false;
            this.waitingWatchParty = null;
            this.waitingWatchPartyId = null;
            this.removeMyJoinRequest(watchPartyId);
            this.router.navigate(['/watchparty', watchPartyId]);
            return;
          }

          this.service.getJoinRequests(watchPartyId).subscribe({
            next: (requests: any[]) => {
              const mine = (requests || [])
                .filter(r => r.userId === this.currentUserId)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

              if (!mine) {
                return;
              }

              this.upsertMyJoinRequest({
                userId: mine.userId,
                watchPartyId,
                watchPartyTitre: data?.titre || this.waitingWatchParty?.titre || '',
                timestamp: mine.timestamp || Date.now(),
                status: mine.status
              });

              if (this.normalizeStatus(mine.status) === 'rejected') {
                this.stopApprovalPolling();
                this.waitingForApproval = false;
                this.waitingWatchParty = null;
                this.waitingWatchPartyId = null;
                this.joinRejected = true;

                setTimeout(() => {
                  this.joinRejected = false;
                }, 5000);
              }
            },
            error: () => {}
          });
        },
        error: (err: any) => {
          if (err?.status === 404) {
            this.stopApprovalPolling();
            this.waitingForApproval = false;
            this.waitingWatchParty = null;
            this.waitingWatchPartyId = null;
          }
        }
      });
    }, 2000);
  }

  private stopApprovalPolling(): void {
    if (this.approvalPollTimer) {
      clearInterval(this.approvalPollTimer);
      this.approvalPollTimer = null;
    }
  }

  cancelJoinRequest(): void {
    this.stopApprovalPolling();
    this.waitingForApproval = false;
    this.waitingWatchParty = null;
    this.waitingWatchPartyId = null;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Admin
  // ────────────────────────────────────────────────────────────────────────────

  blockWatchParty(id: string): void {
    if (!confirm('Block this WatchParty? It will be cancelled and users will be disconnected.')) {
      return;
    }

    this.service.blockWatchParty(id).subscribe({
      next: () => {
        this.showSuccess('WatchParty blocked successfully.');
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to block watch party.';
      }
    });
  }

  deleteWatchParty(id: string): void {
    if (!confirm('Delete this watch party?')) {
      return;
    }

    this.service.delete(id).subscribe({
      next: () => {
        this.showSuccess('WatchParty deleted successfully.');
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to delete watch party.';
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Host approve / reject
  // ────────────────────────────────────────────────────────────────────────────

  approveRequest(request: JoinRequestItem): void {
    this.service.approveJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.showSuccess('Request approved.');
        this.hostPendingRequests = this.hostPendingRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.removeMyJoinRequest(request.watchPartyId, request.userId);
        this.load();
      },
      error: () => {
        this.errorMessage = 'Failed to approve request.';
      }
    });
  }

  rejectRequest(request: JoinRequestItem): void {
    this.service.rejectJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.showSuccess('Request rejected.');
        this.hostPendingRequests = this.hostPendingRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );

        if (request.userId === this.currentUserId) {
          this.upsertMyJoinRequest({
            ...request,
            status: 'rejected'
          });
        }

        this.refreshJoinRequestsState();
      },
      error: () => {
        this.errorMessage = 'Failed to reject request.';
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Navigation
  // ────────────────────────────────────────────────────────────────────────────

  openSession(id: string): void {
    this.router.navigate(['/watchparty', id]);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Display logic helpers
  // ────────────────────────────────────────────────────────────────────────────

  private normalizeStatus(status: string | undefined | null): string {
    return String(status || '').trim().toLowerCase();
  }

  getWatchPartyStatus(watchParty: any): string {
    return String(watchParty?.statut || '').trim().toUpperCase();
  }

  isHost(watchParty: any): boolean {
    return watchParty?.clientId === this.currentUserId || watchParty?.adminId === this.currentUserId;
  }

  isParticipant(watchParty: any): boolean {
    return Array.isArray(watchParty?.participantIds)
      && watchParty.participantIds.includes(this.currentUserId);
  }

  isActiveWatchParty(watchParty: any): boolean {
    const status = this.getWatchPartyStatus(watchParty);
    return status === 'CREATED' || status === 'OPEN';
  }

  isUnavailableWatchParty(watchParty: any): boolean {
    const status = this.getWatchPartyStatus(watchParty);
    return status === 'CLOSED' || status === 'CANCELLED';
  }

  canOpen(watchParty: any): boolean {
    return this.isActiveWatchParty(watchParty) &&
      (this.isHost(watchParty) || this.isParticipant(watchParty));
  }

  canJoin(watchParty: any): boolean {
    return this.isActiveWatchParty(watchParty) &&
      !this.isHost(watchParty) &&
      !this.isParticipant(watchParty) &&
      !this.hasPendingRequest(watchParty) &&
      !this.hasRejectedRequest(watchParty);
  }

  hasPendingRequest(watchParty: any): boolean {
    const req = this.getMyJoinRequestForWatchParty(watchParty?.id);
    return this.normalizeStatus(req?.status) === 'pending';
  }

  hasRejectedRequest(watchParty: any): boolean {
    const req = this.getMyJoinRequestForWatchParty(watchParty?.id);
    return this.normalizeStatus(req?.status) === 'rejected';
  }

  showPendingBadge(watchParty: any): boolean {
    return !this.isHost(watchParty)
      && !this.isParticipant(watchParty)
      && !this.isUnavailableWatchParty(watchParty)
      && this.hasPendingRequest(watchParty);
  }

  showRejectedBadge(watchParty: any): boolean {
    return !this.isHost(watchParty)
      && !this.isParticipant(watchParty)
      && !this.isUnavailableWatchParty(watchParty)
      && this.hasRejectedRequest(watchParty);
  }

  showUnavailableBadge(watchParty: any): boolean {
    return this.isUnavailableWatchParty(watchParty);
  }

  isBlocked(watchParty: any): boolean {
    return this.isUnavailableWatchParty(watchParty);
  }

  private getMyJoinRequestForWatchParty(watchPartyId: string): JoinRequestItem | undefined {
    return this.myJoinRequests.find(r => r.watchPartyId === watchPartyId);
  }

  private upsertMyJoinRequest(request: JoinRequestItem): void {
    const index = this.myJoinRequests.findIndex(
      r => r.watchPartyId === request.watchPartyId && r.userId === request.userId
    );

    if (index >= 0) {
      this.myJoinRequests[index] = request;
      return;
    }

    this.myJoinRequests.push(request);
  }

  private removeMyJoinRequest(watchPartyId: string, userId: string = this.currentUserId): void {
    this.myJoinRequests = this.myJoinRequests.filter(
      r => !(r.watchPartyId === watchPartyId && r.userId === userId)
    );
  }

  private showSuccess(message: string): void {
    this.successMessage = message;

    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }

    this.successTimer = setTimeout(() => {
      this.successMessage = '';
      this.successTimer = null;
    }, 3000);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Polling
  // ────────────────────────────────────────────────────────────────────────────

  private startPollingRequests(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollTimer = setInterval(() => {
      this.refreshJoinRequestsState();
    }, 2500);
  }

  private refreshJoinRequestsState(): void {
    if (this.mode !== 'user') {
      this.hostPendingRequests = [];
      this.myJoinRequests = [];
      return;
    }

    const sourceList = this.isSearchMode ? this.list : this.originalList;

    if (!Array.isArray(sourceList) || sourceList.length === 0) {
      this.hostPendingRequests = [];
      this.myJoinRequests = [];
      this.previousPendingCount = 0;
      return;
    }

    const watchParties = sourceList.filter((wp: any) => !!wp?.id);

    if (watchParties.length === 0) {
      this.hostPendingRequests = [];
      this.myJoinRequests = [];
      this.previousPendingCount = 0;
      return;
    }

    const collectedHostRequests: JoinRequestItem[] = [];
    const collectedMyRequests: JoinRequestItem[] = [];
    let done = 0;

    watchParties.forEach((wp: any) => {
      this.service.getJoinRequests(wp.id).subscribe({
        next: (requests: any[]) => {
          const allRequests = requests || [];

          if (this.isHost(wp)) {
            const pendingForHost = allRequests
              .filter((r: any) => this.normalizeStatus(r.status) === 'pending')
              .map((r: any) => ({
                userId: r.userId,
                watchPartyId: r.watchPartyId,
                watchPartyTitre: wp.titre,
                timestamp: r.timestamp || Date.now(),
                status: r.status
              }));

            collectedHostRequests.push(...pendingForHost);
          }

          const mine = allRequests
            .filter((r: any) => r.userId === this.currentUserId)
            .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))[0];

          if (mine) {
            collectedMyRequests.push({
              userId: mine.userId,
              watchPartyId: mine.watchPartyId,
              watchPartyTitre: wp.titre,
              timestamp: mine.timestamp || Date.now(),
              status: mine.status
            });
          }

          done++;
          if (done === watchParties.length) {
            this.hostPendingRequests = collectedHostRequests;
            this.myJoinRequests = collectedMyRequests;

            if (this.hostPendingRequests.length > this.previousPendingCount) {
              this.newRequestToast = true;
              setTimeout(() => {
                this.newRequestToast = false;
              }, 4000);
            }

            this.previousPendingCount = this.hostPendingRequests.length;
          }
        },
        error: () => {
          done++;
          if (done === watchParties.length) {
            this.hostPendingRequests = collectedHostRequests;
            this.myJoinRequests = collectedMyRequests;
            this.previousPendingCount = this.hostPendingRequests.length;
          }
        }
      });
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Auth helper
  // ────────────────────────────────────────────────────────────────────────────

  private resolveCurrentUserId(): string {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          return String(payload.sub);
        }
      }
    } catch {}

    return '';
  }
}