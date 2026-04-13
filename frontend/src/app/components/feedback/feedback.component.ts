import {
  Component,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { WatchpartyService } from '../../services/watchparty.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: 'user' | 'admin' = 'user';

  note: number | null = null;
  commentaire: string = '';
  watchPartyId: string = '';

  feedbacks: any[] = [];
  allFeedbacks: any[] = [];
  watchParties: any[] = [];
  selectedWatchParty: any = null;

  errorMessage: string = '';
  successMessage: string = '';

  editingId: string | null = null;
  editNote: number | null = null;
  editCommentaire: string = '';

  stars: number[] = [1, 2, 3, 4, 5];
  hoveredStar: number = 0;
  editHoveredStar: number = 0;

  currentUserId: string = '';

  private feedbackPollTimer: ReturnType<typeof setInterval> | null = null;

  private feedbackService = inject(FeedbackService);
  private watchPartyService = inject(WatchpartyService);
  private router = inject(Router);

  ngOnInit(): void {
    this.resolveModeFromRoute();
    this.currentUserId = this.extractUserIdFromToken();
    this.initializePage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.resolveModeFromRoute();
      this.initializePage();
    }
  }

  ngOnDestroy(): void {
    this.stopFeedbackPolling();
  }

  private resolveModeFromRoute(): void {
    this.mode = this.router.url.includes('/admin/') ? 'admin' : 'user';
  }

  private initializePage(): void {
    this.stopFeedbackPolling();
    this.resetMessages();
    this.loadWatchParties();
    this.loadAllFeedbacks();

    if (this.mode === 'user') {
      this.startFeedbackPolling();
    }
  }

  private resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private extractUserIdFromToken(): string {
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        '';

      if (!token) {
        return '';
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      return String(payload.sub || payload.userId || payload.id || payload._id || '');
    } catch {
      return '';
    }
  }

  loadWatchParties(): void {
    this.watchPartyService.getAll().subscribe({
      next: (data) => {
        this.watchParties = (data || []).filter((wp: any) => wp?.statut !== 'CANCELLED');

        if (this.watchPartyId) {
          this.selectedWatchParty =
            this.watchParties.find((w) => w.id === this.watchPartyId) || null;
        }
      },
      error: () => {
        this.watchParties = [];
      }
    });
  }

  loadAllFeedbacks(): void {
    this.feedbackService.getAll().subscribe({
      next: (data) => {
        this.allFeedbacks = data || [];

        if (this.mode === 'admin') {
          this.feedbacks = [...this.allFeedbacks];
          return;
        }

        if (this.watchPartyId) {
          this.feedbacks = this.allFeedbacks.filter(
            (f) => f.watchPartyId === this.watchPartyId
          );
        } else {
          this.feedbacks = [...this.allFeedbacks];
        }
      },
      error: () => {
        this.feedbacks = [];
        this.allFeedbacks = [];
        this.errorMessage = 'Impossible de charger les feedbacks.';
      }
    });
  }

  onWatchPartyChange(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.note = null;
    this.commentaire = '';

    this.selectedWatchParty =
      this.watchParties.find((w) => w.id === this.watchPartyId) || null;

    if (!this.watchPartyId) {
      this.feedbacks = [...this.allFeedbacks];
      return;
    }

    this.feedbacks = this.allFeedbacks.filter(
      (f) => f.watchPartyId === this.watchPartyId
    );
  }

  private startFeedbackPolling(): void {
    this.stopFeedbackPolling();

    this.feedbackPollTimer = setInterval(() => {
      this.loadAllFeedbacks();
    }, 3000);
  }

  private stopFeedbackPolling(): void {
    if (this.feedbackPollTimer) {
      clearInterval(this.feedbackPollTimer);
      this.feedbackPollTimer = null;
    }
  }

  isParticipantOfSelectedWatchParty(): boolean {
    if (!this.selectedWatchParty || !this.currentUserId) {
      return false;
    }

    const participants = Array.isArray(this.selectedWatchParty.participantIds)
      ? this.selectedWatchParty.participantIds
      : [];

    const isParticipant = participants.includes(this.currentUserId);
    const isHost =
      this.selectedWatchParty.clientId === this.currentUserId ||
      this.selectedWatchParty.adminId === this.currentUserId;

    return isParticipant || isHost;
  }

  canCreateFeedback(): boolean {
    return !!this.watchPartyId && this.isParticipantOfSelectedWatchParty();
  }

  canSubmitFeedback(): boolean {
    return this.canCreateFeedback();
  }

  setNote(star: number): void {
    if (!this.canSubmitFeedback()) {
      return;
    }
    this.note = star;
  }

  hoverStar(star: number): void {
    if (!this.canSubmitFeedback()) {
      return;
    }
    this.hoveredStar = star;
  }

  resetHover(): void {
    this.hoveredStar = 0;
  }

  isStarActive(star: number): boolean {
    return star <= (this.hoveredStar || this.note || 0);
  }

  setEditNote(star: number): void {
    this.editNote = star;
  }

  hoverEditStar(star: number): void {
    this.editHoveredStar = star;
  }

  resetEditHover(): void {
    this.editHoveredStar = 0;
  }

  isEditStarActive(star: number): boolean {
    return star <= (this.editHoveredStar || this.editNote || 0);
  }

  vote(feedbackId: string, type: 'like' | 'dislike'): void {
    const call =
      type === 'like'
        ? this.feedbackService.likeFeedback(feedbackId)
        : this.feedbackService.dislikeFeedback(feedbackId);

    call.subscribe({
      next: (updated) => {
        const indexAll = this.allFeedbacks.findIndex((f) => f.id === feedbackId);
        if (indexAll !== -1) {
          this.allFeedbacks[indexAll] = updated;
        }

        const indexVisible = this.feedbacks.findIndex((f) => f.id === feedbackId);
        if (indexVisible !== -1) {
          this.feedbacks[indexVisible] = updated;
        }
      },
      error: () => {
        this.errorMessage = 'Erreur lors du vote.';
      }
    });
  }

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.canCreateFeedback()) {
      this.errorMessage = 'Seuls les participants ou le host de cette WatchParty peuvent ajouter un feedback.';
      return;
    }

    if (form.invalid || !this.note || !this.watchPartyId || !this.commentaire.trim()) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Veuillez corriger les erreurs du formulaire.';
      return;
    }

    this.feedbackService.addFeedback({
      note: this.note,
      commentaire: this.commentaire.trim(),
      watchPartyId: this.watchPartyId
    }).subscribe({
      next: () => {
        this.successMessage = 'Feedback ajouté avec succès.';
        this.note = null;
        this.hoveredStar = 0;
        this.commentaire = '';

        form.resetForm({
          watchPartyId: this.watchPartyId
        });

        this.loadAllFeedbacks();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors de l’ajout.';
      }
    });
  }

  startEdit(feedback: any): void {
    this.editingId = feedback.id;
    this.editNote = feedback.note;
    this.editCommentaire = feedback.commentaire;
    this.editHoveredStar = 0;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editNote = null;
    this.editCommentaire = '';
    this.editHoveredStar = 0;
  }

  saveEdit(id: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.editNote || this.editNote < 1 || this.editNote > 5) {
      this.errorMessage = 'La note doit être entre 1 et 5.';
      return;
    }

    if (!this.editCommentaire || this.editCommentaire.trim().length < 3) {
      this.errorMessage = 'Le commentaire doit faire au moins 3 caractères.';
      return;
    }

    this.feedbackService.updateFeedback(id, {
      note: this.editNote,
      commentaire: this.editCommentaire.trim()
    }).subscribe({
      next: () => {
        this.successMessage = 'Feedback modifié avec succès.';
        this.cancelEdit();
        this.loadAllFeedbacks();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors de la modification.';
      }
    });
  }

  deleteFeedback(id: string): void {
    if (!confirm('Supprimer ce feedback ?')) {
      return;
    }

    this.feedbackService.deleteFeedback(id).subscribe({
      next: () => {
        this.successMessage = 'Feedback supprimé avec succès.';
        this.loadAllFeedbacks();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  getWatchPartyTitle(watchPartyId: string): string {
    const wp = this.watchParties.find((w) => w.id === watchPartyId);
    return wp?.titre || watchPartyId;
  }

  isOwner(feedback: any): boolean {
    return feedback?.clientId === this.currentUserId;
  }

  getSentimentClass(sentiment: string | undefined): string {
    switch ((sentiment || '').toUpperCase()) {
      case 'POSITIF':
        return 'bg-green-500/15 text-green-300 border border-green-500/30';
      case 'NEGATIF':
        return 'bg-red-500/15 text-red-300 border border-red-500/30';
      case 'NEUTRE':
        return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-gray-500/15 text-gray-300 border border-gray-500/30';
    }
  }

  getSentimentEmoji(sentiment: string | undefined): string {
    switch ((sentiment || '').toUpperCase()) {
      case 'POSITIF':
        return '😊';
      case 'NEGATIF':
        return '😞';
      case 'NEUTRE':
        return '😐';
      default:
        return '🤖';
    }
  }

  getSentimentLabel(sentiment: string | undefined): string {
    return (sentiment || 'UNKNOWN').toUpperCase();
  }
}