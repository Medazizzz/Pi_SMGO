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
  imageBase64: string | null = null;
  imageError: string | null = null;

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
      this.imageBase64 = this.postToEdit.imageUrl || null;
    }
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Limite 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Image too large (max 5MB)';
      return;
    }

    this.imageError = null;
    const reader = new FileReader();
    reader.onload = () => {
      this.imageBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageBase64 = null;
    this.imageError = null;
  }

  onSubmit() {
    if (!this.postForm.valid) return;

    const payload = {
      titre: this.postForm.value.titre,
      contenu: this.postForm.value.contenu,
      imageUrl: this.imageBase64 || undefined
    };

    if (this.isEditMode && this.postToEdit?.id) {
      this.postService.updatePost(this.postToEdit.id, payload).subscribe(() => {
        this.refresh.emit();
        this.postForm.reset();
        this.imageBase64 = null;
        this.isEditMode = false;
      });
      return;
    }

    this.postService.createPost(payload).subscribe(() => {
      this.refresh.emit();
      this.postForm.reset();
      this.imageBase64 = null;
    });
  }
}