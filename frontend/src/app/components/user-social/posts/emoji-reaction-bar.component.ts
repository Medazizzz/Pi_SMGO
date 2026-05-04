import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, ReactionResponse } from '../../../services/post.service';

interface EmojiConfig {
  type: string;
  emoji: string;
  label: string;
}

const EMOJIS: EmojiConfig[] = [
  { type: 'LIKE',  emoji: '👍', label: 'Like'  },
  { type: 'LOVE',  emoji: '❤️', label: 'Love'  },
  { type: 'HAHA',  emoji: '😂', label: 'Haha'  },
  { type: 'WOW',   emoji: '😮', label: 'Wow'   },
  { type: 'SAD',   emoji: '😢', label: 'Sad'   },
  { type: 'ANGRY', emoji: '😡', label: 'Angry' }
];

@Component({
  selector: 'app-emoji-reaction-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex items-center gap-2">

      <div class="relative">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
          [class]="userReaction
            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#8B5CF6]'
            : 'bg-[#1A1F2B] border border-[rgba(139,92,246,0.2)] text-[#9CA3AF] hover:border-[#8B5CF6]/50'"
          (click)="togglePopup($event)">
          <span class="text-base">{{ getEmoji(userReaction) }}</span>
          <span>{{ userReaction ? getLabel(userReaction) : 'React' }}</span>
        </button>

        <div *ngIf="popupOpen"
             class="absolute bottom-full left-0 mb-2 flex items-center gap-1
                    bg-[#141920] border border-[rgba(139,92,246,0.3)]
                    rounded-full px-3 py-2 shadow-xl z-50">
          <button *ngFor="let e of emojis"
                  (click)="react(e.type, $event)"
                  [title]="e.label"
                  class="text-xl hover:scale-125 transition-transform cursor-pointer rounded-full p-1"
                  [class.bg-purple-900]="userReaction === e.type">
            {{ e.emoji }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <span *ngFor="let entry of reactionEntries"
              class="flex items-center gap-0.5 text-xs text-[#9CA3AF]/70">
          {{ entry.emoji }} {{ entry.count }}
        </span>
      </div>

    </div>
  `
})
export class EmojiReactionBarComponent implements OnChanges, OnDestroy {
  @Input() postId!: string;
  @Input() reactionCounts: Record<string, number> = {};
  @Input() initialUserReaction: string | null = null;

  emojis = EMOJIS;
  popupOpen = false;
  userReaction: string | null = null;
  counts: Record<string, number> = {};

  private closeListener = () => {
    this.popupOpen = false;
    this.cdr.markForCheck();
  };

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef
  ) {
    document.addEventListener('click', this.closeListener);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closeListener);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reactionCounts']) {
      this.counts = { ...this.reactionCounts };
    }
    if (changes['initialUserReaction']) {
      this.userReaction = this.initialUserReaction;
    }
  }

  get reactionEntries() {
    return Object.entries(this.counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({
        emoji: this.getEmoji(type),
        count
      }));
  }

  getEmoji(type: string | null): string {
    if (!type) return '👍';
    return EMOJIS.find(e => e.type === type)?.emoji ?? '👍';
  }

  getLabel(type: string | null): string {
    if (!type) return 'React';
    return EMOJIS.find(e => e.type === type)?.label ?? 'React';
  }

  togglePopup(event: Event) {
    event.stopPropagation();
    if (this.userReaction) {
      this.react(this.userReaction, event);
    } else {
      this.popupOpen = !this.popupOpen;
      this.cdr.markForCheck();
    }
  }

  react(type: string, event: Event) {
    event.stopPropagation();
    this.popupOpen = false;

    const prev = this.userReaction;

    // Mise à jour optimiste avec nouvel objet pour forcer détection
    if (prev && this.counts[prev]) {
      this.counts = { ...this.counts, [prev]: Math.max(0, this.counts[prev] - 1) };
    }
    if (type !== prev) {
      this.counts = { ...this.counts, [type]: (this.counts[type] || 0) + 1 };
      this.userReaction = type;
    } else {
      this.counts = { ...this.counts };
      this.userReaction = null;
    }
    this.cdr.markForCheck();

    this.postService.toggleReaction(this.postId, type).subscribe({
      next: (res: ReactionResponse) => {
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