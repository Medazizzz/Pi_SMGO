import { AfterViewChecked, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FeedbackService } from '../../services/feedback.service';
import { WatchpartyService } from '../../services/watchparty.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit, OnChanges, AfterViewChecked {

  @Input() mode: 'user' | 'admin' = 'user';
  @ViewChild('ratingChart') ratingChartRef!: ElementRef<HTMLCanvasElement>;

  note: number | null = null;
  commentaire = '';
  watchPartyId = '';
  feedbacks: any[] = [];
  watchParties: any[] = [];
  errorMessage = '';
  successMessage = '';

  editingId: string | null = null;
  editNote: number | null = null;
  editCommentaire = '';

  stars: number[] = [1, 2, 3, 4, 5];
  hoveredStar = 0;
  editHoveredStar = 0;

  isParticipant = false;
  currentUserId = '';

  statsTotal = 0;
  statsMoyenne = 0;
  statsMeilleure = 0;
  statsPire = 0;
  statsRepartition: number[] = [0, 0, 0, 0, 0];
  starsArray = '';

  private chartInstance: Chart | null = null;
  private chartRendered = false;
  private readonly userStorageKey = 'wp_current_user_id';

  constructor(
    private feedbackService: FeedbackService,
    private watchPartyService: WatchpartyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mode = this.router.url.includes('/admin/') ? 'admin' : 'user';

    this.currentUserId = this.resolveCurrentUserId();

    if (this.mode === 'admin') {
      this.loadFeedbacks();
    } else {
      this.loadWatchParties();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']?.currentValue === 'admin') {
      this.loadFeedbacks();
    }
    if (changes['mode']?.currentValue === 'user') {
      this.loadWatchParties();
    }
  }

  ngAfterViewChecked(): void {
    if (this.statsTotal > 0 && !this.chartRendered && this.ratingChartRef?.nativeElement) {
      this.chartRendered = true;
      this.renderChart();
    }
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
        // Continue with token/local fallback.
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

  loadFeedbacks(): void {
    this.feedbackService.getAll().subscribe({
      next: (data) => {
        this.feedbacks = data;
        this.errorMessage = '';
        this.computeStats();
      },
      error: () => {
        this.errorMessage = 'Unable to load feedbacks.';
      }
    });
  }

  loadWatchParties(): void {
    this.watchPartyService.getAll().subscribe({
      next: (data) => {
        this.watchParties = data;
      },
      error: () => {
        this.watchParties = [];
      }
    });
  }

  onWatchPartyChange(): void {
    this.isParticipant = false;
    this.feedbacks = [];
    this.errorMessage = '';

    if (!this.watchPartyId) {
      return;
    }

    this.feedbackService.getByWatchParty(this.watchPartyId).subscribe({
      next: (data) => {
        this.feedbacks = data;
        this.computeStats();
      },
      error: () => {
        this.errorMessage = 'Unable to load watchparty feedbacks.';
      }
    });

    this.watchPartyService.getParticipants(this.watchPartyId).subscribe({
      next: (participants: string[]) => {
        this.isParticipant = participants.includes(this.currentUserId);
      },
      error: () => {
        this.isParticipant = false;
      }
    });
  }

  submit(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.watchPartyId) {
      this.errorMessage = 'Please select a WatchParty first.';
      return;
    }

    if (!this.isParticipant) {
      this.errorMessage = 'You must join this WatchParty before adding feedback.';
      return;
    }

    if (form.invalid || !this.note) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Please correct the form errors.';
      return;
    }

    const payload = {
      note: this.note!,
      commentaire: this.commentaire.trim(),
      watchPartyId: this.watchPartyId.trim(),
      clientId: this.currentUserId
    };

    this.feedbackService.addFeedback(payload).subscribe({
      next: () => {
        this.successMessage = 'Feedback added successfully.';
        form.resetForm();
        this.note = null;
        this.hoveredStar = 0;
        this.commentaire = '';
        this.watchPartyId = '';
        this.isParticipant = false;
        this.feedbacks = [];
      },
      error: () => {
        this.errorMessage = 'Failed to add feedback.';
      }
    });
  }

  vote(feedbackId: string, type: 'like' | 'dislike'): void {
    const call = type === 'like'
      ? this.feedbackService.likeFeedback(feedbackId, this.currentUserId)
      : this.feedbackService.dislikeFeedback(feedbackId, this.currentUserId);

    call.subscribe({
      next: (updated) => {
        const index = this.feedbacks.findIndex(f => f.id === feedbackId);
        if (index !== -1) {
          this.feedbacks[index] = updated;
        }
      },
      error: () => {
        this.errorMessage = 'Failed to register vote.';
      }
    });
  }

  setNote(star: number): void {
    this.note = star;
  }

  hoverStar(star: number): void {
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

  computeStats(): void {
    this.chartRendered = false;

    if (this.feedbacks.length === 0) {
      this.statsTotal = 0;
      this.statsMoyenne = 0;
      this.statsMeilleure = 0;
      this.statsPire = 0;
      this.statsRepartition = [0, 0, 0, 0, 0];
      this.starsArray = '';
      return;
    }

    const notes = this.feedbacks.map((f) => f.note);
    this.statsTotal = this.feedbacks.length;
    const sum = notes.reduce((a, b) => a + b, 0);
    this.statsMoyenne = Number((sum / notes.length).toFixed(1));
    this.statsMeilleure = Math.max(...notes);
    this.statsPire = Math.min(...notes);
    this.statsRepartition = [1, 2, 3, 4, 5].map((n) => notes.filter((v) => v === n).length);
    const rounded = Math.round(this.statsMoyenne);
    this.starsArray = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  }

  renderChart(): void {
    const canvas = this.ratingChartRef?.nativeElement;
    if (!canvas) {
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
        datasets: [
          {
            data: this.statsRepartition,
            backgroundColor: ['#E24B4A', '#EF9F27', '#888780', '#1D9E75', '#8B5CF6'],
            borderRadius: 6,
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#9CA3AF' },
            grid: { color: 'rgba(139,92,246,0.1)' }
          },
          x: {
            ticks: { color: '#9CA3AF' },
            grid: { display: false }
          }
        }
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

    if (this.editNote === null || this.editNote < 1 || this.editNote > 5) {
      this.errorMessage = 'Rating must be between 1 and 5.';
      return;
    }

    if (!this.editCommentaire || this.editCommentaire.trim().length < 5) {
      this.errorMessage = 'Comment must be at least 5 characters.';
      return;
    }

    const payload = {
      note: this.editNote,
      commentaire: this.editCommentaire.trim()
    };

    this.feedbackService.updateFeedback(id, payload).subscribe({
      next: () => {
        this.successMessage = 'Feedback updated successfully.';
        this.cancelEdit();
        this.loadFeedbacks();
      },
      error: () => {
        this.errorMessage = 'Failed to update feedback.';
      }
    });
  }

  deleteFeedback(id: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!confirm('Delete this feedback?')) return;

    this.feedbackService.deleteFeedback(id).subscribe({
      next: () => {
        this.successMessage = 'Feedback deleted successfully.';
        this.loadFeedbacks();
      },
      error: () => {
        this.errorMessage = 'Failed to delete feedback.';
      }
    });
  }
}
