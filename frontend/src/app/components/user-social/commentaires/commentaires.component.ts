import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommentaireService, Commentaire } from '../../../services/commentaire.service';

@Component({
  selector: 'app-commentaires',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './commentaires.component.html'
})
export class CommentairesComponent implements OnInit {
  @Input() postId!: string;

  commentaires: Commentaire[] = [];
  commentForm: FormGroup;
  editingId: string | null = null;

  constructor(
    private commentaireService: CommentaireService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      contenu: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
    this.loadCommentaires();
  }

  loadCommentaires() {
    this.commentaireService.getByPostId(this.postId).subscribe(data => this.commentaires = data);
  }

  onSubmit() {
    if (this.commentForm.invalid) {
      return;
    }

    const payload = {
      contenu: this.commentForm.value.contenu,
      postId: this.postId
    };

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
    });
  }

  editCommentaire(c: Commentaire) {
    this.editingId = c.id!;
    this.commentForm.patchValue({ contenu: c.contenu });
  }

  deleteCommentaire(id: string) {
    if (confirm('Delete this comment?')) {
      this.commentaireService.delete(id).subscribe(() => this.loadCommentaires());
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.commentForm.reset();
  }
}
