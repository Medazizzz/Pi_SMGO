import {
  Component, Input, OnChanges, OnDestroy, OnInit,
  Output, EventEmitter, SimpleChanges, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  contents: any[] = [];
  filteredContents: any[] = [];
  searchQuery = '';
  selectedContent: any = null;
  showDropdown = false;

  list: any[] = [];
  errorMessage = '';
  successMessage = '';

  createdWatchPartyId: string | null = null;
  inviteLink = '';
  linkCopied = false;

  waitingForApproval = false;
  waitingWatchParty: any = null;
  joinRejected = false;
  private waitingWatchPartyId: string | null = null;

  pendingRequests: {
    userId: string;
    watchPartyId: string;
    watchPartyTitre: string;
    timestamp: number;
    status?: string;
  }[] = [];

  newRequestToast = false;
  private previousPendingCount = 0;

  private service = inject(WatchpartyService);
  private http = inject(HttpClient);
  private router = inject(Router);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private approvalPollTimer: ReturnType<typeof setInterval> | null = null;
  private dropdownTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (changes['mode']) { this.load(); }
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  private clearAllTimers(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    if (this.approvalPollTimer) { clearInterval(this.approvalPollTimer); this.approvalPollTimer = null; }
    if (this.dropdownTimer) { clearTimeout(this.dropdownTimer); this.dropdownTimer = null; }
  }

  // ─── Content search ───────────────────────────────────────────────────────

  loadContents(): void {
    this.http.get<any[]>(this.contentApiUrl).subscribe({
      next: (data) => { this.contents = data || []; },
      error: () => { console.warn('Could not load contents list.'); }
    });
  }

  searchContents(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (q.length < 2) { this.filteredContents = []; this.showDropdown = false; return; }
    this.filteredContents = this.contents.filter(c => c.title?.toLowerCase().includes(q));
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
    this.dropdownTimer = setTimeout(() => { this.showDropdown = false; }, 200);
  }

  // ─── Load list ────────────────────────────────────────────────────────────
  // Admin → toutes les sessions sans filtre
  // User  → uniquement sessions avec au moins 1 participant

  load(): void {
    this.service.getAll().subscribe({
      next: (data: any[]) => {
        const all = data || [];
        this.list = this.mode === 'admin'
          ? all
          : all.filter((wp: any) => (wp.participantIds?.length || 0) > 0);
        this.errorMessage = '';
      },
      error: () => { this.errorMessage = 'Unable to load watch parties.'; }
    });
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.createdWatchPartyId = null;
    this.linkCopied = false;

    if (form.invalid || !this.selectedContent) {
      form.control.markAllAsTouched();
      if (!this.selectedContent) { this.errorMessage = 'Please select a content.'; }
      return;
    }

    const payload = { titre: this.titre.trim(), contenuId: this.contenuId };

    this.service.add(payload).subscribe({
      next: (created) => {
        this.successMessage = 'WatchParty created successfully.';
        this.createdWatchPartyId = created?.id ?? null;
        if (created?.id) { this.inviteLink = `${window.location.origin}/watchparty/${created.id}`; }
        form.resetForm();
        this.titre = '';
        this.contenuId = '';
        this.clearContent();
        this.load();
        setTimeout(() => { this.createdWatchPartyId = null; this.linkCopied = false; }, 30000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to create watch party.';
      }
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.inviteLink).then(() => {
      this.linkCopied = true;
      setTimeout(() => { this.linkCopied = false; }, 3000);
    });
  }

  closeInvite(): void { this.createdWatchPartyId = null; this.linkCopied = false; }

  // ─── Join flow ────────────────────────────────────────────────────────────

  joinWatchParty(watchParty: any): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.service.createJoinRequest(watchParty.id).subscribe({
      next: () => {
        this.waitingForApproval = true;
        this.waitingWatchParty = watchParty;
        this.waitingWatchPartyId = watchParty.id;
        this.startPollingApproval(watchParty.id);
      },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to send join request.'; }
    });
  }

  private startPollingApproval(watchPartyId: string): void {
    if (this.approvalPollTimer) { clearInterval(this.approvalPollTimer); this.approvalPollTimer = null; }
    this.approvalPollTimer = setInterval(() => {
      this.service.getById(watchPartyId).subscribe({
        next: (data: any) => {
          const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];
          if (participants.includes(this.currentUserId)) {
            this.stopApprovalPolling();
            this.waitingForApproval = false;
            this.waitingWatchParty = null;
            this.waitingWatchPartyId = null;
            this.router.navigate(['/watchparty', watchPartyId]);
            return;
          }
          this.service.getJoinRequests(watchPartyId).subscribe({
            next: (requests: any[]) => {
              const mine = (requests || []).find(r => r.userId === this.currentUserId);
              if (mine?.status === 'rejected') {
                this.stopApprovalPolling();
                this.waitingForApproval = false;
                this.waitingWatchParty = null;
                this.waitingWatchPartyId = null;
                this.joinRejected = true;
                setTimeout(() => { this.joinRejected = false; }, 5000);
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
    if (this.approvalPollTimer) { clearInterval(this.approvalPollTimer); this.approvalPollTimer = null; }
  }

  cancelJoinRequest(): void {
    this.stopApprovalPolling();
    this.waitingForApproval = false;
    this.waitingWatchParty = null;
    this.waitingWatchPartyId = null;
  }

  // ─── Admin: block / delete ────────────────────────────────────────────────

  blockWatchParty(id: string): void {
    if (!confirm('Block this WatchParty? It will be cancelled and users will be disconnected.')) { return; }
    this.service.blockWatchParty(id).subscribe({
      next: () => { this.successMessage = 'WatchParty blocked successfully.'; this.load(); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to block watch party.'; }
    });
  }

  deleteWatchParty(id: string): void {
    if (!confirm('Delete this watch party?')) { return; }
    this.service.delete(id).subscribe({
      next: () => { this.successMessage = 'WatchParty deleted successfully.'; this.load(); },
      error: (err) => { this.errorMessage = err?.error?.error || 'Failed to delete watch party.'; }
    });
  }

  // ─── Host: approve / reject ───────────────────────────────────────────────

  approveRequest(request: any): void {
    this.service.approveJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.successMessage = 'Request approved!';
        this.pendingRequests = this.pendingRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.load();
      },
      error: () => { this.errorMessage = 'Failed to approve request.'; }
    });
  }

  rejectRequest(request: any): void {
    this.service.rejectJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.successMessage = 'Request rejected.';
        this.pendingRequests = this.pendingRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
      },
      error: () => { this.errorMessage = 'Failed to reject request.'; }
    });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  openSession(id: string): void {
    this.router.navigate(['/watchparty', id]);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  isHost(watchParty: any): boolean {
    return watchParty?.clientId === this.currentUserId || watchParty?.adminId === this.currentUserId;
  }

  isParticipant(watchParty: any): boolean {
    return Array.isArray(watchParty?.participantIds) &&
      watchParty.participantIds.includes(this.currentUserId);
  }

  canJoin(watchParty: any): boolean {
    return !this.isHost(watchParty) && !this.isParticipant(watchParty);
  }

  isBlocked(watchParty: any): boolean {
    return watchParty?.statut === 'CANCELLED' || watchParty?.statut === 'CLOSED';
  }

  // ─── Polling: host join-request notifications ─────────────────────────────

  private startPollingRequests(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.pollTimer = setInterval(() => {
      if (this.mode !== 'user') { this.pendingRequests = []; return; }
      const myWatchParties = this.list.filter(
        (wp) => wp.clientId === this.currentUserId || wp.adminId === this.currentUserId
      );
      if (myWatchParties.length === 0) { this.pendingRequests = []; return; }
      const collected: any[] = [];
      let done = 0;
      myWatchParties.forEach((wp) => {
        this.service.getJoinRequests(wp.id).subscribe({
          next: (requests: any[]) => {
            const pending = (requests || [])
              .filter((r) => r.status === 'pending')
              .map((r) => ({ ...r, watchPartyTitre: wp.titre }));
            collected.push(...pending);
            done++;
            if (done === myWatchParties.length) {
              this.pendingRequests = collected;
              if (this.pendingRequests.length > this.previousPendingCount) {
                this.newRequestToast = true;
                setTimeout(() => { this.newRequestToast = false; }, 4000);
              }
              this.previousPendingCount = this.pendingRequests.length;
            }
          },
          error: () => {
            done++;
            if (done === myWatchParties.length) { this.pendingRequests = collected; }
          }
        });
      });
    }, 2000);
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