import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'smgo-theme-mode';
  readonly theme = signal<ThemeMode>(this.readInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(nextTheme);
    this.applyTheme(nextTheme);
    localStorage.setItem(this.storageKey, nextTheme);
  }

  private readInitialTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(this.storageKey);
    return savedTheme === 'light' ? 'light' : 'dark';
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }
}
