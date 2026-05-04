import {
  Component, Input, OnChanges, OnDestroy,
  SimpleChanges, ChangeDetectorRef, ElementRef,
  ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ReactionCount {
  [key: string]: number;
}

@Component({
  selector: 'app-comment-reaction-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex items-center gap-2">

      <!-- Bouton principal -->
      <button
        (click)="togglePicker($event)"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all"
        [class]="userReaction
          ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#8B5CF6]'
          : 'bg-[#1A1F2B] border border-[rgba(139,92,246,0.2)] text-[#9CA3AF] hover:border-[#8B5CF6]/50'">
        <span class="text-sm">{{ userReaction || '😊' }}</span>
        <span>{{ userReaction ? 'Reacted' : 'React' }}</span>
      </button>

      <!-- Emoji Picker container -->
      <div *ngIf="pickerOpen"
           class="absolute bottom-full left-0 mb-2 z-50"
           (click)="$event.stopPropagation()">
        <div #pickerContainer></div>
      </div>

      <!-- Compteurs -->
      <div class="flex items-center gap-1 flex-wrap">
        <span *ngFor="let entry of reactionEntries"
              class="flex items-center gap-0.5 text-xs text-[#9CA3AF]/70
                     bg-[#1A1F2B] px-1.5 py-0.5 rounded-full cursor-pointer
                     hover:bg-[#252B38] transition-colors"
              (click)="react(entry.type)"
              [title]="entry.type">
          {{ entry.emoji }} {{ entry.count }}
        </span>
      </div>

    </div>
  `
})
export class CommentReactionBarComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() commentaireId!: string;
  @Input() reactionCounts: ReactionCount = {};
  @Input() initialUserReaction: string | null = null;

  @ViewChild('pickerContainer') pickerContainer!: ElementRef;

  pickerOpen = false;
  userReaction: string | null = null;
  counts: ReactionCount = {};
  private picker: any = null;
  private closeListener = (e: Event) => {
    this.pickerOpen = false;
    this.destroyPicker();
    this.cdr.markForCheck();
  };

  private readonly apiUrl = 'http://localhost:8090/api/commentaires';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    document.addEventListener('click', this.closeListener);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reactionCounts']) this.counts = { ...this.reactionCounts };
    if (changes['initialUserReaction']) this.userReaction = this.initialUserReaction;
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    document.removeEventListener('click', this.closeListener);
    this.destroyPicker();
  }

  get reactionEntries() {
    return Object.entries(this.counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, emoji: type, count }));
  }

  togglePicker(event: Event) {
    event.stopPropagation();
    if (this.pickerOpen) {
      this.pickerOpen = false;
      this.destroyPicker();
    } else {
      this.pickerOpen = true;
      this.cdr.detectChanges();
      setTimeout(() => this.initPicker(), 0);
    }
  }

  private async initPicker() {
    if (!this.pickerContainer?.nativeElement) return;
    this.destroyPicker();

    const { Picker } = await import('emoji-mart');
    const { default: data } = await import('@emoji-mart/data');

    this.picker = new Picker({
      data,
      onEmojiSelect: (emoji: any) => {
        this.react(emoji.native);
      },
      theme: 'dark',
      set: 'native',
      locale: 'fr',
      previewPosition: 'none',
      skinTonePosition: 'none',
    });

    this.pickerContainer.nativeElement.appendChild(this.picker);
  }

  private destroyPicker() {
    if (this.pickerContainer?.nativeElement) {
      this.pickerContainer.nativeElement.innerHTML = '';
    }
    this.picker = null;
  }

  react(emoji: string) {
    this.pickerOpen = false;
    this.destroyPicker();

    const prev = this.userReaction;

    // Mise à jour optimiste
    if (prev) {
      this.counts = { ...this.counts, [prev]: Math.max(0, (this.counts[prev] || 1) - 1) };
    }
    if (emoji !== prev) {
      this.counts = { ...this.counts, [emoji]: (this.counts[emoji] || 0) + 1 };
      this.userReaction = emoji;
    } else {
      this.userReaction = null;
    }
    this.cdr.markForCheck();

    // Appel API
    this.http.post<any>(`${this.apiUrl}/${this.commentaireId}/reactions`, {
      reactionType: emoji
    }).subscribe({
      next: (res) => {
        this.counts = { ...res.reactionCounts };
        this.userReaction = res.userReaction;
        this.cdr.markForCheck();
      },
      error: () => {
        this.counts = { ...this.reactionCounts };
        this.userReaction = prev;
        this.cdr.markForCheck();
      }
    });
  }
}