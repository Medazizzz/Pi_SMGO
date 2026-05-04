import { Injectable } from '@angular/core';
import { Router, canActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Authentication Guard
 * WHY: Protects routes from unauthorized access
 * Redirects to login if user is not authenticated
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.getToken()) {
      return true;
    }

    // Store the attempted URL for redirecting
    this.router.navigate(['/auth/login']);
    return false;
  }
}
