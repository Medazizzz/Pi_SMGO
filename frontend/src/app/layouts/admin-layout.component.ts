import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import {
  FileText,
  MapPin,
  Calendar,
  Armchair,
  Bell,
  UserCog,
  CreditCard,
  Shield,
  MessageSquare,
  Play,
  Menu,
  X,
  Ticket,
  ArrowRight,
  Tag,
  LogOut,
} from 'lucide-angular';
import { AuthService } from '../services/auth.service';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  queryParams?: Record<string, string>;
}

interface ModuleTab {
  label: string;
  route: string;
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <!-- Admin Mode with Sidebar -->
    <div class="min-h-screen bg-[#0B0E14] text-white flex w-full">
      <!-- Admin Sidebar -->
      <aside
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
        class="fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0B0E14] border-r border-[#8B5CF6]/20 transition-transform duration-200 ease-in-out z-50 flex flex-col">
        <!-- Sidebar Header -->
        <div class="border-b border-[#8B5CF6]/20 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-xl flex items-center justify-center">
              <span class="w-6 h-6 text-white"></span>
            </div>
            <div>
              <h1 class="text-lg font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                ShowMatchGoOn
              </h1>
              <p class="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <!-- Sidebar Content -->
        <div class="flex-1 overflow-y-auto p-2">
          <nav class="space-y-1">
            <a
              *ngFor="let tab of adminTabs"
              [routerLink]="tab.route"
              [queryParams]="tab.queryParams"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm hover:bg-[#8B5CF6] hover:text-white text-gray-400">
              <span class="w-4 h-4"></span>
              <span>{{ tab.label }}</span>
            </a>
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div class="border-t border-[#8B5CF6]/20 p-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-xl flex items-center justify-center shrink-0">
                <span class="w-6 h-6 text-white"></span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-white truncate">ShowMatchGoOn</p>
                <p class="text-xs text-gray-400 truncate">Admin Panel</p>
              </div>
            </div>
            <button
              (click)="logout()"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500/60 text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-sm">
              <span class="w-4 h-4"></span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      <div
        *ngIf="!sidebarOpen()"
        (click)="toggleSidebar()"
        class="fixed inset-0 bg-black/50 z-40 md:hidden"></div>

      <!-- Admin Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Admin Header -->
        <header class="sticky top-0 z-40 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-[#8B5CF6]/20">
          <div class="flex items-center gap-4 h-16 px-4 sm:px-6 lg:px-8">
            <button
              (click)="toggleSidebar()"
              class="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#8B5CF6]/10 rounded-lg">
              <span class="w-5 h-5"></span>
            </button>
            <div class="flex-1"></div>
          </div>
        </header>



        <!-- Admin Content -->
        <main class="flex-1 overflow-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly TicketIcon = Ticket;
  readonly FileTextIcon = FileText;
  readonly MapPinIcon = MapPin;
  readonly BellIcon = Bell;
  readonly UserCogIcon = UserCog;
  readonly CreditCardIcon = CreditCard;
  readonly ShieldIcon = Shield;
  readonly MessageSquareIcon = MessageSquare;
  readonly PlayIcon = Play;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly ArrowRightIcon = ArrowRight;
  readonly TagIcon = Tag;
  readonly LogOutIcon = LogOut;

  sidebarOpen = signal(true);

  readonly adminTabs: TabItem[] = [
    { id: 'advanced', label: 'Advanced', icon: FileText, route: '/admin/advanced' },
    { id: 'content', label: 'Content', icon: FileText, route: '/admin/content' },
    { id: 'categories', label: 'Categories', icon: Tag, route: '/admin/categories' },
    { id: 'cinema', label: 'Cinema', icon: Ticket, route: '/admin/cinema' },
    { id: 'cinema-sessions', label: 'Sessions', icon: Calendar, route: '/admin/cinema', queryParams: { module: 'seances' } as any },
    { id: 'cinema-halls', label: 'Halls', icon: MapPin, route: '/admin/cinema', queryParams: { module: 'salles' } as any },
    { id: 'cinema-reservations', label: 'Reservations', icon: Armchair, route: '/admin/cinema', queryParams: { module: 'reservations' } as any },
    { id: 'notifications', label: 'Notifications', icon: Bell, route: '/admin/notifications' },
    { id: 'abonnements', label: 'Subscriptions', icon: CreditCard, route: '/admin/abonnements' },
    { id: 'fidelities', label: 'Loyalty Levels', icon: Shield, route: '/admin/fidelities' },
    { id: 'promotions', label: 'Promotions', icon: Tag, route: '/admin/promotions' },
    { id: 'watchparty', label: 'WatchParty', icon: Play, route: '/admin/watchparty' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, route: '/admin/feedback' },
    { id: 'users', label: 'Users & Loyalty', icon: UserCog, route: '/admin/users' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}


