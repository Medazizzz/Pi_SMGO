import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private router: Router, readonly themeService: ThemeService) {}

  switchMode(mode: 'admin' | 'user') {
    this.router.navigate([`/${mode}`]);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}