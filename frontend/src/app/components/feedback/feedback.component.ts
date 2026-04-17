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

type SentimentFilter = 'ALL' | 'POSITIF' | 'NEGATIF' | 'NEUTRE' | 'UNKNOWN';
type SortOption = 'recent' | 'oldest' | 'mostLiked' | 'highestNote' | 'lowestNote';

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

  searchTerm: string = '';
  selectedNoteFilter: string = 'ALL';
  selectedSentimentFilter: SentimentFilter = 'ALL';
  sortOption: SortOption = 'recent';

  availableEmojis: string[] = ['❤️', '😂', '😮', '😢', '😡', '🔥'];
  private emojiStorageKey = 'feedback_emoji_reactions_v1';
  emojiReactions: Record<string, Record<string, number>> = {};
  userEmojiSelections: Record<string, string> = {};

  isCheckingGrammar: boolean = false;
  correctedPreview: string = '';

  private feedbackPollTimer: ReturnType<typeof setInterval> | null = null;

  private feedbackService = inject(FeedbackService);
  private watchPartyService = inject(WatchpartyService);
  private router = inject(Router);

  ngOnInit(): void {
    this.resolveModeFromRoute();
    this.currentUserId = this.extractUserIdFromToken();
    this.loadEmojiState();
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

        this.applyFilters();
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
        this.applyFilters();
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
    this.correctedPreview = '';

    this.selectedWatchParty =
      this.watchParties.find((w) => w.id === this.watchPartyId) || null;

    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedNoteFilter = 'ALL';
    this.selectedSentimentFilter = 'ALL';
    this.sortOption = 'recent';
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.allFeedbacks];

    if (this.mode === 'user' && this.watchPartyId) {
      result = result.filter((f) => f.watchPartyId === this.watchPartyId);
    }

    const query = this.normalizeText(this.searchTerm);
    if (query) {
      result = result.filter((f) => {
        const watchPartyTitle = this.getWatchPartyTitle(f.watchPartyId);
        const searchable = [
          f.commentaire || '',
          f.clientId || '',
          watchPartyTitle || '',
          String(f.note ?? ''),
          f.sentiment || ''
        ]
          .map((value) => this.normalizeText(String(value)))
          .join(' ');

        return searchable.includes(query);
      });
    }

    if (this.selectedNoteFilter !== 'ALL') {
      const note = Number(this.selectedNoteFilter);
      result = result.filter((f) => Number(f.note) === note);
    }

    if (this.selectedSentimentFilter !== 'ALL') {
      result = result.filter(
        (f) => this.normalizeSentiment(f.sentiment) === this.selectedSentimentFilter
      );
    }

    result.sort((a, b) => {
      switch (this.sortOption) {
        case 'oldest':
          return this.getFeedbackDate(a) - this.getFeedbackDate(b);
        case 'mostLiked':
          return (Number(b.likes) || 0) - (Number(a.likes) || 0);
        case 'highestNote':
          return (Number(b.note) || 0) - (Number(a.note) || 0);
        case 'lowestNote':
          return (Number(a.note) || 0) - (Number(b.note) || 0);
        case 'recent':
        default:
          return this.getFeedbackDate(b) - this.getFeedbackDate(a);
      }
    });

    this.feedbacks = result;
  }

  private getFeedbackDate(feedback: any): number {
    if (!feedback?.dateFeedback) {
      return 0;
    }

    const timestamp = new Date(feedback.dateFeedback).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private normalizeSentiment(sentiment: string | undefined): SentimentFilter {
    const value = (sentiment || 'UNKNOWN').toUpperCase();
    if (value === 'POSITIF' || value === 'NEGATIF' || value === 'NEUTRE') {
      return value;
    }
    return 'UNKNOWN';
  }

  private normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
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

        this.applyFilters();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du vote.';
      }
    });
  }

  checkGrammar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const rawText = this.commentaire?.trim();

    if (!rawText) {
      this.errorMessage = 'Please write a comment first.';
      return;
    }

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      '';

    if (!token) {
      this.errorMessage = 'You must be logged in.';
      return;
    }

    this.isCheckingGrammar = true;

    this.feedbackService.correctComment(rawText).subscribe({
      next: (response) => {
        this.correctedPreview = response.correctedText || rawText;
        this.isCheckingGrammar = false;
      },
      error: () => {
        this.errorMessage = 'Grammar correction failed.';
        this.isCheckingGrammar = false;
      }
    });
  }

  useCorrectedText(): void {
    if (this.correctedPreview?.trim()) {
      this.commentaire = this.correctedPreview.trim();
    }
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

    const correctedComment = this.correctedPreview?.trim()
      ? this.correctedPreview.trim()
      : this.commentaire.trim();

    this.feedbackService.addFeedback({
      note: this.note,
      commentaire: correctedComment,
      watchPartyId: this.watchPartyId
    }).subscribe({
      next: () => {
        this.successMessage = 'Feedback ajouté avec succès.';
        this.note = null;
        this.hoveredStar = 0;
        this.commentaire = '';
        this.correctedPreview = '';

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

    const correctedComment = this.editCommentaire.trim();

    this.feedbackService.updateFeedback(id, {
      note: this.editNote,
      commentaire: correctedComment
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

  previewCorrectedComment(): string {
    return this.correctedPreview || '';
  }

  previewCorrectedEditComment(): string {
    return this.editCommentaire || '';
  }

  private loadEmojiState(): void {
    try {
      const savedReactions = localStorage.getItem(this.emojiStorageKey);
      const savedSelections = localStorage.getItem(`${this.emojiStorageKey}_user_${this.currentUserId || 'guest'}`);

      this.emojiReactions = savedReactions ? JSON.parse(savedReactions) : {};
      this.userEmojiSelections = savedSelections ? JSON.parse(savedSelections) : {};
    } catch {
      this.emojiReactions = {};
      this.userEmojiSelections = {};
    }
  }

  private saveEmojiState(): void {
    localStorage.setItem(this.emojiStorageKey, JSON.stringify(this.emojiReactions));
    localStorage.setItem(
      `${this.emojiStorageKey}_user_${this.currentUserId || 'guest'}`,
      JSON.stringify(this.userEmojiSelections)
    );
  }

  reactWithEmoji(feedbackId: string, emoji: string): void {
    if (!feedbackId) {
      return;
    }

    if (!this.emojiReactions[feedbackId]) {
      this.emojiReactions[feedbackId] = {};
    }

    const previousEmoji = this.userEmojiSelections[feedbackId];

    if (previousEmoji === emoji) {
      const currentCount = this.emojiReactions[feedbackId][emoji] || 0;
      this.emojiReactions[feedbackId][emoji] = Math.max(0, currentCount - 1);

      if (this.emojiReactions[feedbackId][emoji] === 0) {
        delete this.emojiReactions[feedbackId][emoji];
      }

      delete this.userEmojiSelections[feedbackId];
      this.saveEmojiState();
      return;
    }

    if (previousEmoji) {
      const previousCount = this.emojiReactions[feedbackId][previousEmoji] || 0;
      this.emojiReactions[feedbackId][previousEmoji] = Math.max(0, previousCount - 1);

      if (this.emojiReactions[feedbackId][previousEmoji] === 0) {
        delete this.emojiReactions[feedbackId][previousEmoji];
      }
    }

    this.emojiReactions[feedbackId][emoji] = (this.emojiReactions[feedbackId][emoji] || 0) + 1;
    this.userEmojiSelections[feedbackId] = emoji;
    this.saveEmojiState();
  }

  getEmojiCount(feedbackId: string, emoji: string): number {
    return this.emojiReactions?.[feedbackId]?.[emoji] || 0;
  }

  hasUserSelectedEmoji(feedbackId: string, emoji: string): boolean {
    return this.userEmojiSelections?.[feedbackId] === emoji;
  }

  getFilteredCountLabel(): string {
    return `${this.feedbacks.length} feedback(s)`;
  }
}