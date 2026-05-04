import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService, Post } from '../../../services/post.service';
import { AddPostComponent } from '../add-post/add-post.component';
import { CommentairesComponent } from '../commentaires/commentaires.component';
import { AuthService } from '../../../services/auth.service';
import { EmojiReactionBarComponent } from './emoji-reaction-bar.component';


@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, AddPostComponent, CommentairesComponent,EmojiReactionBarComponent],
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {

  posts: Post[] = [];
  selectedPost: Post | null = null;
  showAddForm = false;
  expandedPosts = new Set<string>();
  currentUsername: string | null = null; // ✅

  constructor(private postService: PostService, private authService: AuthService) {}

  ngOnInit() {
    this.currentUsername = this.authService.getCurrentUser()?.username || null; // ✅
    this.loadPostsWithStats();
  }

  loadPostsWithStats() {
    this.postService.getPostsWithStats().subscribe(data => this.posts = data);
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
      this.postService.deletePost(id).subscribe(() => this.loadPostsWithStats());
    }
  }

  clearSelection() {
    this.selectedPost = null;
    this.showAddForm = false;
    this.loadPostsWithStats();
  }

  toggleComments(postId: string) {
  if (this.expandedPosts.has(postId)) {
    this.expandedPosts.delete(postId);
  } else {
    this.expandedPosts.add(postId);
    // ✅ Incrémente les vues à l'ouverture des commentaires
    this.postService.getPost(postId).subscribe(updatedPost => {
      const post = this.posts.find(p => p.id === postId);
      if (post) post.vues = updatedPost.vues;
    });
  }
}

  isExpanded(postId: string): boolean {
    return this.expandedPosts.has(postId);
  }

  isOwner(post: Post): boolean { // ✅
    return this.currentUsername === post.authorUsername;
  }
  activeTab: 'recent' | 'foryou' = 'recent';

switchTab(tab: 'recent' | 'foryou') {
  this.activeTab = tab;
  if (tab === 'foryou') {
    this.postService.getPostsForYouPage().subscribe(data => this.posts = data);
  } else {
    this.loadPostsWithStats();
  }
}
}