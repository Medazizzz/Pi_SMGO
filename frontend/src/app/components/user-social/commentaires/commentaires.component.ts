import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommentaireService, Commentaire } from '../../../services/commentaire.service';
import { AuthService } from '../../../services/auth.service';
import { CommentReactionBarComponent } from './comment-reaction-bar.component';

@Component({
  selector: 'app-commentaires',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CommentReactionBarComponent],
  templateUrl: './commentaires.component.html'
})
export class CommentairesComponent implements OnInit, OnDestroy {
  @Input() postId!: string;
  @Input() postAuthorUsername!: string; // ✅ auteur du post
  @Output() commentAdded = new EventEmitter<void>(); // ✅ notifie le parent
  @ViewChild('emojiPickerContainer') emojiPickerContainer!: ElementRef;
  @ViewChild('commentInput') commentInput!: ElementRef;

  commentaires: Commentaire[] = [];
  commentForm: FormGroup;
  editingId: string | null = null;
  currentUsername: string | null = null;
  emojiPickerOpen = false;
  private picker: any = null;

  private closePickerListener = () => {
    if (this.emojiPickerOpen) {
      this.emojiPickerOpen = false;
      this.destroyPicker();
      this.cdr.markForCheck();
    }
  };

  constructor(
    private commentaireService: CommentaireService,
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.commentForm = this.fb.group({
      contenu: ['', [Validators.required, Validators.minLength(5)]]
    });
    document.addEventListener('click', this.closePickerListener);
  }

  ngOnInit() {
    this.currentUsername = this.authService.getCurrentUser()?.username || null;
    this.loadCommentaires();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closePickerListener);
    this.destroyPicker();
  }

  loadCommentaires() {
    this.commentaireService.getByPostId(this.postId).subscribe(data => this.commentaires = data);
  }

  // ✅ Propriétaire du commentaire OU auteur du post peut supprimer
  isOwner(c: Commentaire): boolean {
    return this.currentUsername === c.authorUsername
        || this.currentUsername === this.postAuthorUsername;
  }

  isCommentOwner(c: Commentaire): boolean {
    return this.currentUsername === c.authorUsername;
  }

  async toggleEmojiPicker(event: Event) {
    event.stopPropagation();
    if (this.emojiPickerOpen) {
      this.emojiPickerOpen = false;
      this.destroyPicker();
      return;
    }
    this.emojiPickerOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => this.initPicker(), 0);
  }

  private async initPicker() {
    if (!this.emojiPickerContainer?.nativeElement) return;
    this.destroyPicker();

    const { Picker } = await import('emoji-mart');
    const { default: data } = await import('@emoji-mart/data');

    this.picker = new Picker({
      data,
      onEmojiSelect: (emoji: any) => {
        const current = this.commentForm.get('contenu')?.value || '';
        this.commentForm.get('contenu')?.setValue(current + emoji.native);
        this.commentInput?.nativeElement?.focus();
      },
      theme: 'dark',
      set: 'native',
      locale: 'fr',
      previewPosition: 'none',
      skinTonePosition: 'none',
    });

    this.emojiPickerContainer.nativeElement.appendChild(this.picker);
  }

  private destroyPicker() {
    if (this.emojiPickerContainer?.nativeElement) {
      this.emojiPickerContainer.nativeElement.innerHTML = '';
    }
    this.picker = null;
  }

  onSubmit() {
    if (this.commentForm.invalid) return;
    const payload = { contenu: this.commentForm.value.contenu, postId: this.postId };

    if (this.editingId) {
      this.commentaireService.update(this.editingId, payload).subscribe(() => {
        this.loadCommentaires();
        this.commentForm.reset();
        this.editingId = null;
      });
      return;
    }

    this.commentaireService.create(payload).subscribe(() => {
      this.loadCommentaires();
      this.commentForm.reset();
      this.commentAdded.emit(); // ✅ notifie le parent
    });
  }

  editCommentaire(c: Commentaire) {
    this.editingId = c.id!;
    this.commentForm.patchValue({ contenu: c.contenu });
  }

  deleteCommentaire(id: string) {
    if (confirm('Delete this comment?')) {
      this.commentaireService.delete(id).subscribe(() => {
        this.loadCommentaires();
        this.commentAdded.emit(); // ✅ met à jour le compteur
      });
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.commentForm.reset();
  }
}