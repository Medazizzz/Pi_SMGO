import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Award, Crown, Star, Shield } from 'lucide-angular';
import { FidelityService } from '../../services/fidelity.service';
import { Fidelity } from '../../models/fidelity.model';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-fidelity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-fidelity.component.html'
})
export class UserFidelityComponent implements OnInit {

  readonly AwardIcon  = Award;
  readonly CrownIcon  = Crown;
  readonly StarIcon   = Star;
  readonly ShieldIcon = Shield;

  fidelities:  Fidelity[] = [];
  loading      = false;
  loadingUser  = false;
  errorMessage = '';
  userScore    = 0;
  userLevel    = 'BRONZE';
  userName     = '';

  constructor(
    private service:     FidelityService,
    private authService: AuthService,
    private http:        HttpClient
  ) {}

  ngOnInit(): void {
    this.loadFidelities();
    this.loadUserScore();
  }

  loadFidelities(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next:  (data) => { this.fidelities = data; this.loading = false; },
      error: ()     => { this.errorMessage = 'Unable to load loyalty levels.'; this.loading = false; }
    });
  }

  loadUserScore(): void {
    this.loadingUser = true;
    const userId = this.authService.getCurrentUserId();
    if (!userId) { this.loadingUser = false; return; }

    this.http.get<any>(`http://localhost:8090/api/users/${userId}`)
      .subscribe({
        next: (user) => {
          this.userScore   = user.fidelityScore || 0;
          this.userLevel   = user.fidelityLevel || 'BRONZE';
          this.userName    = user.username      || '';
          this.loadingUser = false;
        },
        error: () => { this.loadingUser = false; }
      });
  }

  getLevelEmoji(): string {
    switch (this.userLevel) {
      case 'GOLD':     return '🥇';
      case 'SILVER':   return '🥈';
      case 'PLATINUM': return '💎';
      default:         return '🥉';
    }
  }

  getLevelColorClass(): string {
    switch (this.userLevel) {
      case 'PLATINUM': return 'text-blue-400';
      case 'GOLD':     return 'text-yellow-500';
      case 'SILVER':   return 'text-gray-300';
      default:         return 'text-orange-500';
    }
  }

  getLevelBorderClass(): string {
    switch (this.userLevel) {
      case 'PLATINUM': return 'border-blue-400/50';
      case 'GOLD':     return 'border-yellow-500/50';
      case 'SILVER':   return 'border-gray-400/50';
      default:         return 'border-orange-500/50';
    }
  }

  getProgressPercent(): number {
    if (this.userLevel === 'PLATINUM') return 100;
    return Math.min(
      Math.round((this.userScore / this.getNextLevelTarget()) * 100), 100
    );
  }

  getNextLevelTarget(): number {
    switch (this.userLevel) {
      case 'BRONZE':  return 500;
      case 'SILVER':  return 1000;
      case 'GOLD':    return 2000;
      default:        return 2000;
    }
  }

  getNextLevel(): string {
    switch (this.userLevel) {
      case 'BRONZE':  return 'SILVER';
      case 'SILVER':  return 'GOLD';
      case 'GOLD':    return 'PLATINUM';
      default:        return 'MAX';
    }
  }

  getEncouragementMessage(): string {
    if (this.userLevel === 'PLATINUM')
      return "🎉 Incredible! You've reached the highest level. You're a true VIP!";
    const pct = this.getProgressPercent();
    if (pct >= 80) return `🔥 Almost there! Only ${this.getNextLevelTarget() - this.userScore} points to ${this.getNextLevel()}!`;
    if (pct >= 50) return `💪 Great progress! Keep it up — ${this.getNextLevelTarget() - this.userScore} points to go!`;
    if (pct >= 25) return `🚀 You're on your way! ${this.getNextLevelTarget() - this.userScore} points left for ${this.getNextLevel()}.`;
    return `👋 Welcome ${this.userName}! Start earning points to unlock better rewards!`;
  }

  getTips(): string[] {
    switch (this.userLevel) {
      case 'BRONZE': return [
        '📺 Watch more content to earn points',
        '🎟️ Make reservations to boost your score',
        '📋 Subscribe to a plan — even BASIC earns points',
        '🔔 Stay active — log in every day',
        '🎁 Use promotional offers'
      ];
      case 'SILVER': return [
        '⬆️ Upgrade to PREMIUM subscription',
        '🎬 Book cinema sessions regularly',
        '👥 Invite friends for bonus points',
        '🌟 Complete your profile',
        '📅 Stay consistent every month'
      ];
      case 'GOLD': return [
        '💎 Upgrade to ELITE for maximum points',
        '🏆 You are close to PLATINUM!',
        '🎪 Book VIP sessions for double points',
        '🤝 Refer premium members',
        '📊 Maintain high activity'
      ];
      default: return [
        '👑 You have unlocked all VIP benefits!',
        '🎁 Enjoy free upgrades on reservations',
        '⭐ Your feedback shapes future features',
        '🥂 Thank you for your exceptional loyalty!'
      ];
    }
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'border-blue-400 text-blue-400';
      case 'GOLD':     return 'border-yellow-500 text-yellow-500';
      case 'SILVER':   return 'border-gray-400 text-gray-300';
      default:         return 'border-orange-600 text-orange-500';
    }
  }

  getLevelGlow(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'hover:shadow-blue-400/20 border-blue-400/40';
      case 'GOLD':     return 'hover:shadow-yellow-500/20 border-yellow-500/40';
      case 'SILVER':   return 'hover:shadow-gray-400/20 border-gray-400/40';
      default:         return 'hover:shadow-orange-600/20 border-orange-600/40';
    }
  }

  getLevelBg(level: string): string {
    switch (level) {
      case 'PLATINUM': return 'bg-blue-400/10';
      case 'GOLD':     return 'bg-yellow-500/10';
      case 'SILVER':   return 'bg-gray-400/10';
      default:         return 'bg-orange-600/10';
    }
  }
}