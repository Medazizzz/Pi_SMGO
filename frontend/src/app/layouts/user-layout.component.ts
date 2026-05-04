import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import {
  Home,
  Sparkles,
  Ticket,
  Calendar,
  MapPin,
  Armchair,
  Users,
  CreditCard,
  Award,
  MessageSquare,
  Play,
  Menu,
  X,
  ArrowRight,
  LogOut,
} from 'lucide-angular';
import { trigger, style, transition, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header class="sticky top-0 z-40 bg-[var(--surface-elevated)] backdrop-blur-xl border-b border-[var(--border)]">
        <div class="max-w-full px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 min-w-0 gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <div class="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-xl flex items-center justify-center">
                <span class="w-6 h-6 text-white"></span>
              </div>
              <div>
                <h1 class="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                  ShowMatchGoOn
                </h1>
                <p class="text-xs text-gray-400">Your Entertainment Hub</p>
              </div>
            </div>

            <button
              (click)="logout()"
              class="hidden md:flex items-center gap-2 px-3 py-2 border border-red-500/60 text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-sm shrink-0"
            >
              <span class="w-4 h-4"></span>
              <span>Log Out</span>
            </button>

            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#8B5CF6]/10 rounded-lg shrink-0">
              <span class="w-6 h-6"></span>
            </button>
          </div>

          <nav class="flex items-center gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pr-2 min-w-0 scrollbar-hide whitespace-nowrap touch-pan-x snap-x snap-mandatory" style="-webkit-overflow-scrolling: touch;">
            <a
              *ngFor="let tab of userTabs"
              [routerLink]="tab.route"
              [queryParams]="tab.queryParams"
              class="shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#8B5CF6]/10">
              <span class="w-4 h-4"></span>
              <span class="text-sm">{{ tab.label }}</span>
            </a>
          </nav>
        </div>

        <div *ngIf="mobileMenuOpen()" [@slideDown] class="md:hidden border-t border-[#8B5CF6]/20 overflow-hidden">
          <div class="px-4 py-4 space-y-2">
            <a
              *ngFor="let tab of userTabs"
              [routerLink]="tab.route"
              [queryParams]="tab.queryParams"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#8B5CF6]/10">
              <span class="w-5 h-5"></span>
              <span>{{ tab.label }}</span>
            </a>
            <button
              (click)="logout()"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 border-t border-[#8B5CF6]/20 mt-3 pt-4">
              <span class="w-5 h-5"></span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main class="pb-12">
        <router-outlet></router-outlet>
      </main>

      <footer class="border-t border-[var(--border)] py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center">
                <span class="w-5 h-5 text-white"></span>
              </div>
              <div>
                <p class="text-sm text-white">ShowMatchGoOn</p>
                <p class="text-xs text-gray-400">© 2026 All rights reserved</p>
              </div>
            </div>
            <div class="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" class="hover:text-[#8B5CF6] transition-colors">Privacy Policy</a>
              <a href="#" class="hover:text-[#8B5CF6] transition-colors">Terms of Service</a>
              <a href="#" class="hover:text-[#8B5CF6] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
  styles: [
    `
      :host ::ng-deep nav {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      :host ::ng-deep nav::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class UserLayoutComponent {
  readonly TicketIcon = Ticket;
  readonly ArrowRightIcon = ArrowRight;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly LogOutIcon = LogOut;
  constructor(private authService: AuthService, private router: Router) {}

  mobileMenuOpen = signal(false);

  readonly userTabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home, route: '/user/home' },
    { id: 'cinema', label: 'Cinema', icon: Ticket, route: '/user/cinema' },
    { id: 'watchparty', label: 'WatchParty', icon: Play, route: '/user/watchparty' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, route: '/user/feedback' },
    { id: 'seances', label: 'Seances', icon: Calendar, route: '/user/cinema', queryParams: { module: 'sessions' } },
    { id: 'halls', label: 'Halls', icon: MapPin, route: '/user/cinema', queryParams: { module: 'halls' } },
    { id: 'reservations', label: 'Reservations', icon: Armchair, route: '/user/cinema', queryParams: { module: 'reservations' } },
    { id: 'social', label: 'Social', icon: Users, route: '/user/social' },
    { id: 'posts', label: 'Posts', icon: Users, route: '/user/social/posts' },
    { id: 'profile', label: 'Profile', icon: Users, route: '/user/social/profile' },
    { id: 'promotions', label: 'Promotions', icon: CreditCard, route: '/user/social/promotions' },
    { id: 'abonnements', label: 'Subscriptions', icon: CreditCard, route: '/user/abonnements' },
    { id: 'fidelities', label: 'Loyalty', icon: Award, route: '/user/fidelities' },
  ];

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen.set(false);
    this.router.navigate(['/auth/login']);
  }
}


