import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Users, User, Tag } from 'lucide-angular';

@Component({
  selector: 'app-social-overlay',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './social-overlay.component.html',
  styleUrls: ['./social-overlay.component.css'],
})
export class SocialOverlayComponent {
  readonly UsersIcon = Users;
  readonly UserIcon = User;
  readonly TagIcon = Tag;
}


