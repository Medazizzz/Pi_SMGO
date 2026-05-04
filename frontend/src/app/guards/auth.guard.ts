import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

/**
 * Authentication Guard
 * WHY: Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getToken()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

/**
 * Admin Guard
 * WHY: Protects admin routes - only admin users can access
 * Redirects non-admin users to user dashboard
 */
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getToken()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = (localStorage.getItem('userRole') || '').toUpperCase();
  const isAdmin = role.includes('ADMIN');

  if (isAdmin) {
    return true;
  }

  router.navigate(['/user/home']);
  return false;
};

/**
 * User Guard
 * WHY: Protects user routes - only non-admin users can access
 * Redirects admin users to admin dashboard
 */
export const userGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getToken()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = (localStorage.getItem('userRole') || '').toUpperCase();
  const isAdmin = role.includes('ADMIN');

  if (!isAdmin) {
    return true;
  }

  router.navigate(['/admin/content']);
  return false;
};
