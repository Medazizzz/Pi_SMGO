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
type FeedbackMode = 'text' | 'voice';

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

  feedbackMode: FeedbackMode = 'text';

  isRecording: boolean = false;
  isPreparingRecorder: boolean = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  recordedAudioFile: File | null = null;
  recordedAudioUrl: string | null = null;
  private mediaStream: MediaStream | null = null;

  feedbacks: any[] = [];
  allFeedbacks: any[] = [];
  watchParties: any[] = [];
  selectedWatchParty: any = null;
  riskList: any[] = [];
selectedRiskLevel: 'SAFE' | 'MEDIUM_RISK' | 'HIGH_RISK' = 'SAFE';
visibleRiskWatchParties: any[] = [];

  errorMessage: string = '';
  successMessage: string = '';

  editingId: string | null = null;
  editNote: number | null = null;
  editCommentaire: string = '';

  stars: number[] = [1, 2, 3, 4, 5];
  hoveredStar: number = 0;
  editHoveredStar: number = 0;

  currentUserId: string = '';

  feedbackView: 'ALL' | 'MINE' | 'OTHERS' = 'ALL';

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

  openedEmojiPickerId: string | null = null;

  private feedbackPollTimer: ReturnType<typeof setInterval> | null = null;
  private blockedFeedbackStorageKey = 'blocked_feedback_ids_v1';
  blockedFeedbackIds: string[] = [];

  bannedWords: string[] = [
    'fuck',
    'shit',
    'bitch',
    'idiot',
    'asshole',
    'stupid',
    'dumb',
    'moron'
  ];

  badWordDetected: boolean = false;
  badWordMessage: string = '';

  showWatchPartyFeedbackModal = false;
selectedModalWatchParty: any = null;
modalFeedbacks: any[] = [];

  editBadWordDetected: boolean = false;
  editBadWordMessage: string = '';

  private feedbackService = inject(FeedbackService);
  private watchPartyService = inject(WatchpartyService);
  private router = inject(Router);

  ngOnInit(): void {
    this.resolveModeFromRoute();
    this.currentUserId = this.extractUserIdFromToken();
    this.loadEmojiState();
    this.loadBlockedFeedbacks();
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
    this.stopRecordingTracks();
    this.revokeRecordedAudioUrl();
  }

  private resolveModeFromRoute(): void {
    this.mode = this.router.url.includes('/admin/') ? 'admin' : 'user';
  }

  private initializePage(): void {
  this.stopFeedbackPolling();
  this.resetMessages();
  this.loadWatchParties();
  this.loadAllFeedbacks();

  if (this.mode === 'admin') {
    this.loadWatchPartyRisks();
  }

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

  loadWatchPartyRisks(): void {
  this.watchPartyService.getAllRisks().subscribe({
    next: (data: any[]) => {
      this.riskList = data || [];
      this.filterRiskWatchParties('SAFE');
    },
    error: () => {
      this.errorMessage = 'Impossible de charger les WatchParty à risque.';
    }
  });
}

filterRiskWatchParties(level: 'SAFE' | 'MEDIUM_RISK' | 'HIGH_RISK'): void {
  this.selectedRiskLevel = level;
  this.visibleRiskWatchParties = this.riskList.filter(
    r => r.riskLevel === level
  );
}

countRisk(level: 'SAFE' | 'MEDIUM_RISK' | 'HIGH_RISK'): number {
  return this.riskList.filter(r => r.riskLevel === level).length;
}

  onWatchPartyChange(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.note = null;
    this.commentaire = '';
    this.correctedPreview = '';
    this.badWordDetected = false;
    this.badWordMessage = '';
    this.resetVoiceState();

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

  selectFeedbackMode(mode: FeedbackMode): void {
    if (this.feedbackMode === mode) {
      return;
    }

    this.feedbackMode = mode;
    this.errorMessage = '';
    this.successMessage = '';

    if (mode === 'text') {
      this.stopRecordingIfNeeded();
      this.resetVoiceState();
    } else {
      this.commentaire = '';
      this.correctedPreview = '';
      this.badWordDetected = false;
      this.badWordMessage = '';
    }
  }

  async startRecording(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.canSubmitFeedback()) {
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      this.errorMessage = 'Votre navigateur ne supporte pas l’enregistrement audio.';
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      this.errorMessage = 'MediaRecorder non supporté dans ce navigateur.';
      return;
    }

    try {
      this.isPreparingRecorder = true;
      this.revokeRecordedAudioUrl();
      this.recordedAudioFile = null;
      this.audioChunks = [];

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        this.recordedAudioFile = new File(
          [audioBlob],
          `feedback-audio-${Date.now()}.${extension}`,
          { type: mimeType }
        );

        this.revokeRecordedAudioUrl();
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
        this.audioChunks = [];
        this.stopRecordingTracks();
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
    } catch (error) {
      this.errorMessage = 'Impossible d’accéder au micro.';
      this.stopRecordingTracks();
    } finally {
      this.isPreparingRecorder = false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  removeRecordedAudio(): void {
    this.stopRecordingIfNeeded();
    this.resetVoiceState();
  }

  private stopRecordingIfNeeded(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    } else {
      this.stopRecordingTracks();
    }
  }

  private stopRecordingTracks(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  private revokeRecordedAudioUrl(): void {
    if (this.recordedAudioUrl) {
      URL.revokeObjectURL(this.recordedAudioUrl);
      this.recordedAudioUrl = null;
    }
  }

  private resetVoiceState(): void {
    this.stopRecordingTracks();
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedAudioFile = null;
    this.isRecording = false;
    this.isPreparingRecorder = false;
    this.revokeRecordedAudioUrl();
  }

 private applyFilters(): void {
  let result = [...this.allFeedbacks];

  result = result.filter((f) => !this.blockedFeedbackIds.includes(f.id));

  if (this.mode === 'user' && this.watchPartyId) {
    result = result.filter((f) => f.watchPartyId === this.watchPartyId);
  }

  if (this.mode === 'user') {
    if (this.feedbackView === 'MINE') {
      result = result.filter((f) => f.clientId === this.currentUserId);
    }

    if (this.feedbackView === 'OTHERS') {
      result = result.filter((f) => f.clientId !== this.currentUserId);
    }
  }

  const query = this.normalizeText(this.searchTerm);
    if (query) {
      result = result.filter((f) => {
        const watchPartyTitle = this.getWatchPartyTitle(f.watchPartyId);
        const watchPartyHost = this.getWatchPartyHost(f.watchPartyId);

        const searchable = [
          f.commentaire || '',
          f.clientId || '',
          watchPartyTitle || '',
          watchPartyHost || '',
          String(f.note ?? ''),
          f.sentiment || '',
          f.audioUrl ? 'audio vocal voice message micro' : ''
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

    // Ralenti pour éviter de couper le lecteur audio dans le front office
    this.feedbackPollTimer = setInterval(() => {
      this.loadAllFeedbacks();
    }, 30000);
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

  canSubmitCurrentMode(): boolean {
    if (!this.canSubmitFeedback() || !this.note) {
      return false;
    }

    if (this.feedbackMode === 'text') {
      return !!this.commentaire.trim() && !this.badWordDetected;
    }

    return !!this.recordedAudioFile && !this.isRecording;
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

  private containsBannedWord(text: string): string | null {
    const normalizedText = this.normalizeText(text || '');

    if (!normalizedText) {
      return null;
    }

    for (const word of this.bannedWords) {
      const normalizedWord = this.normalizeText(word);
      if (normalizedWord && normalizedText.includes(normalizedWord)) {
        return word;
      }
    }

    return null;
  }

  checkBadWords(): void {
    const foundWord = this.containsBannedWord(this.commentaire);

    if (foundWord) {
      this.badWordDetected = true;
      this.badWordMessage = `Inappropriate word detected: "${foundWord}". Please change your comment.`;
      this.correctedPreview = '';
      return;
    }

    this.badWordDetected = false;
    this.badWordMessage = '';
  }

  checkEditBadWords(): void {
    const foundWord = this.containsBannedWord(this.editCommentaire);

    if (foundWord) {
      this.editBadWordDetected = true;
      this.editBadWordMessage = `Inappropriate word detected: "${foundWord}". Please change your comment.`;
      return;
    }

    this.editBadWordDetected = false;
    this.editBadWordMessage = '';
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
      this.checkBadWords();
    }
  }

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.canCreateFeedback()) {
      this.errorMessage = 'Seuls les participants ou le host de cette WatchParty peuvent ajouter un feedback.';
      return;
    }

    if (!this.note || !this.watchPartyId) {
      this.errorMessage = 'Veuillez choisir une WatchParty et une note.';
      return;
    }

    if (this.feedbackMode === 'text') {
      this.checkBadWords();

      if (this.badWordDetected) {
        this.errorMessage = this.badWordMessage || 'Inappropriate language detected.';
        return;
      }

      if (form.invalid || !this.commentaire.trim()) {
        form.control.markAllAsTouched();
        this.errorMessage = 'Veuillez écrire un commentaire.';
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
          this.badWordDetected = false;
          this.badWordMessage = '';

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

      return;
    }

    if (!this.recordedAudioFile) {
      this.errorMessage = 'Veuillez enregistrer un message vocal.';
      return;
    }

    this.feedbackService.addFeedbackWithAudio({
      note: this.note,
      watchPartyId: this.watchPartyId,
      audioFile: this.recordedAudioFile
    }).subscribe({
      next: () => {
        this.successMessage = 'Message vocal ajouté avec succès.';
        this.note = null;
        this.hoveredStar = 0;
        this.resetVoiceState();

        form.resetForm({
          watchPartyId: this.watchPartyId
        });

        this.loadAllFeedbacks();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error || err?.error?.message || 'Erreur lors de l’ajout du vocal.';
      }
    });
  }

  startEdit(feedback: any): void {
    this.editingId = feedback.id;
    this.editNote = feedback.note;
    this.editCommentaire = feedback.commentaire;
    this.editHoveredStar = 0;
    this.editBadWordDetected = false;
    this.editBadWordMessage = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editNote = null;
    this.editCommentaire = '';
    this.editHoveredStar = 0;
    this.editBadWordDetected = false;
    this.editBadWordMessage = '';
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

    this.checkEditBadWords();

    if (this.editBadWordDetected) {
      this.errorMessage = this.editBadWordMessage || 'Inappropriate language detected.';
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

// Ajoute cette méthode juste après :
getWatchPartyHost(watchPartyId: string): string {
  const wp = this.watchParties.find((w) => w.id === watchPartyId);
  if (!wp) {
    return 'Unknown host';
  }
  return wp.clientId || wp.adminId || 'Unknown host';
}


getFeedbackCountForWatchParty(watchPartyId: string): number {
  if (!watchPartyId) return 0;
  return this.allFeedbacks.filter(f => f.watchPartyId === watchPartyId).length;
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

  getAudioUrl(audioUrl: string | undefined): string {
    if (!audioUrl) {
      return '';
    }

    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }

    return `http://localhost:8090${audioUrl}`;
  }

  hasAudio(feedback: any): boolean {
    return !!feedback?.audioUrl;
  }

  private loadEmojiState(): void {
    try {
      const savedReactions = localStorage.getItem(this.emojiStorageKey);
      const savedSelections = localStorage.getItem(
        `${this.emojiStorageKey}_user_${this.currentUserId || 'guest'}`
      );

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

    this.emojiReactions[feedbackId][emoji] =
      (this.emojiReactions[feedbackId][emoji] || 0) + 1;
    this.userEmojiSelections[feedbackId] = emoji;
    this.saveEmojiState();
  }

  getEmojiCount(feedbackId: string, emoji: string): number {
    return this.emojiReactions?.[feedbackId]?.[emoji] || 0;
  }

  getTotalReactions(feedbackId: string): number {
    const reactions = this.emojiReactions?.[feedbackId] || {};
    return Object.values(reactions).reduce((sum, count) => sum + Number(count || 0), 0);
  }

  hasUserSelectedEmoji(feedbackId: string, emoji: string): boolean {
    return this.userEmojiSelections?.[feedbackId] === emoji;
  }

  setFeedbackView(view: 'ALL' | 'MINE' | 'OTHERS'): void {
  this.feedbackView = view;
  this.applyFilters();
}

getMyFeedbackCount(): number {
  return this.allFeedbacks.filter((f) => f.clientId === this.currentUserId).length;
}

getOtherFeedbackCount(): number {
  return this.allFeedbacks.filter((f) => f.clientId !== this.currentUserId).length;
}

  getFilteredCountLabel(): string {
    return `${this.feedbacks.length} feedback(s)`;
  }

  private loadBlockedFeedbacks(): void {
    try {
      const saved = localStorage.getItem(this.blockedFeedbackStorageKey);
      this.blockedFeedbackIds = saved ? JSON.parse(saved) : [];
    } catch {
      this.blockedFeedbackIds = [];
    }
  }

  private saveBlockedFeedbacks(): void {
    localStorage.setItem(
      this.blockedFeedbackStorageKey,
      JSON.stringify(this.blockedFeedbackIds)
    );
  }

  toggleBlockFeedback(feedbackId: string): void {
    if (!feedbackId) {
      return;
    }

    if (this.blockedFeedbackIds.includes(feedbackId)) {
      return;
    }

    this.blockedFeedbackIds.push(feedbackId);
    this.saveBlockedFeedbacks();
    this.successMessage = 'Feedback blocked successfully.';
    this.applyFilters();
  }

  toggleEmojiPicker(feedbackId: string): void {
    this.openedEmojiPickerId =
      this.openedEmojiPickerId === feedbackId ? null : feedbackId;
  }

  selectEmoji(feedbackId: string, emoji: string): void {
    this.reactWithEmoji(feedbackId, emoji);
    this.openedEmojiPickerId = null;
  }

  openWatchPartyFeedbackModal(watchParty: any): void {
  this.selectedModalWatchParty = watchParty;
  
  // Cherche par toutes les clés possibles d'ID
  const wpId = watchParty.id || watchParty.watchPartyId;
  
  this.modalFeedbacks = this.allFeedbacks.filter(f => 
    f.watchPartyId === wpId || 
    f.watchPartyId === watchParty.id || 
    f.watchPartyId === watchParty.watchPartyId
  );
  
  this.showWatchPartyFeedbackModal = true;
}

closeWatchPartyFeedbackModal(): void {
  this.showWatchPartyFeedbackModal = false;
  this.selectedModalWatchParty = null;
  this.modalFeedbacks = [];
}

getAccentClass(sentiment: string): string {
  switch (sentiment) {
    case 'POSITIF': return 'accent-positive';
    case 'NEGATIF': return 'accent-negative';
    case 'NEUTRE':  return 'accent-neutral';
    default:        return 'accent-unknown';
  }
}
}