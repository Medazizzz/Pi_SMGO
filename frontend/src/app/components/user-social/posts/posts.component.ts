import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, Post } from '../../../services/post.service';
import { AddPostComponent } from '../add-post/add-post.component';
import { CommentairesComponent } from '../commentaires/commentaires.component';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, AddPostComponent, CommentairesComponent],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  selectedPost: Post | null = null;
  showAddForm = false;
  expandedPosts = new Set<string>();

  constructor(private postService: PostService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe(data => this.posts = data);
  }

  editPost(post: Post) {
    this.selectedPost = post;
    this.showAddForm = true;
  }

  deletePost(id: string) {
    if (confirm('Delete this post?')) {
      this.postService.deletePost(id).subscribe(() => this.loadPosts());
    }
  }

  clearSelection() {
    this.selectedPost = null;
    this.showAddForm = false;
    this.loadPosts();
  }

  toggleComments(postId: string) {
    if (this.expandedPosts.has(postId)) {
      this.expandedPosts.delete(postId);
    } else {
      this.expandedPosts.add(postId);
    }
  }

  isExpanded(postId: string): boolean {
    return this.expandedPosts.has(postId);
  }
}
