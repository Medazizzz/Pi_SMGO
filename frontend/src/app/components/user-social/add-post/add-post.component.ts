import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PostService, Post } from '../../../services/post.service';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-post.component.html'
})
export class AddPostComponent implements OnChanges {
  @Input() postToEdit: Post | null = null;
  @Output() refresh = new EventEmitter<void>();

  postForm: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder, private postService: PostService) {
    this.postForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      contenu: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnChanges() {
    if (this.postToEdit) {
      this.isEditMode = true;
      this.postForm.patchValue(this.postToEdit);
    }
  }

  onSubmit() {
    if (!this.postForm.valid) {
      return;
    }

    const payload = {
      titre: this.postForm.value.titre,
      contenu: this.postForm.value.contenu
    };

    if (this.isEditMode && this.postToEdit?.id) {
      this.postService.updatePost(this.postToEdit.id, payload).subscribe(() => {
        this.refresh.emit();
        this.postForm.reset();
        this.isEditMode = false;
      });
      return;
    }

    this.postService.createPost(payload).subscribe(() => {
      this.refresh.emit();
      this.postForm.reset();
    });
  }
}
