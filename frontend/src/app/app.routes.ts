import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout.component';
import { UserLayoutComponent } from './layouts/user-layout.component';
import { adminGuard, userGuard } from './guards/auth.guard';

/**
 * Application Routes Configuration
 * WHY: Defines all application routes with lazy loading
 * Implements proper navigation structure for the SPA
 */
export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent),
    data: { title: 'Login' }
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent),
    data: { title: 'Register' }
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./components/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { title: 'Forgot Password' }
  },

  // Admin panel with layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./components/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
        data: { title: 'User Management' }
      },
      {
        path: 'promotions',
        loadComponent: () => import('./components/admin-promotions/admin-promotions.component').then(m => m.AdminPromotionsComponent),
        data: { title: 'Promotions' }
      },
      {
        path: 'advanced',
        loadComponent: () => import('./components/admin-advanced/admin-advanced.component').then(m => m.AdminAdvancedComponent),
        data: { title: 'Advanced' }
      },
      {
        path: 'content',
        loadComponent: () => import('./components/admin-content/admin-content.component').then(m => m.AdminContentComponent),
        data: { title: 'Content' }
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent),
        data: { title: 'Categories' }
      },
      {
        path: 'cinema',
        loadComponent: () => import('./components/admin-cinema/admin-cinema.component').then(m => m.AdminCinemaComponent),
        data: { title: 'Cinema Management' }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./components/admin-notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent),
        data: { title: 'Notifications' }
      },
      {
        path: 'abonnements',
        loadComponent: () => import('./components/admin-abonnement/admin-abonnement.component').then(m => m.AdminAbonnementComponent),
        data: { title: 'Subscriptions' }
      },
      {
        path: 'fidelities',
        loadComponent: () => import('./components/admin-fidelity/admin-fidelity.component').then(m => m.AdminFidelityComponent),
        data: { title: 'Loyalty Levels' }
      },
      {
        path: 'watchparty',
        loadComponent: () => import('./components/watchparty/watchparty.component').then(m => m.WatchPartyComponent),
        data: { title: 'WatchParty' }
      },
      {
        path: 'feedback',
        loadComponent: () => import('./components/feedback/feedback.component').then(m => m.FeedbackComponent),
        data: { title: 'Feedback' }
      },
      {
        path: '',
        redirectTo: 'advanced',
        pathMatch: 'full'
      }
    ]
  },

  // User panel with layout
  {
    path: 'user',
    component: UserLayoutComponent,
    canActivate: [userGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./components/unified-home/unified-home.component').then(m => m.UnifiedHomeComponent),
        data: { title: 'Home' }
      },
      {
        path: 'discover',
        loadComponent: () => import('./components/ai-discovery/ai-discovery.component').then(m => m.AiDiscoveryComponent),
        data: { title: 'Discovery' }
      },
      {
        path: 'cinema',
        loadComponent: () => import('./components/cinema-journey/cinema-journey.component').then(m => m.CinemaJourneyComponent),
        data: { title: 'Cinema' }
      },
      {
        path: 'social',
        loadComponent: () => import('./components/social-overlay/social-overlay.component').then(m => m.SocialOverlayComponent),
        data: { title: 'Social' },
        children: [
          {
            path: 'posts',
            loadComponent: () => import('./components/user-social/posts/posts.component').then(m => m.PostsComponent),
            data: { title: 'Posts' }
          },
          {
            path: 'profile',
            loadComponent: () => import('./components/user-social/profile/profile.component').then(m => m.ProfileComponent),
            data: { title: 'Profile' }
          },
          {
            path: 'promotions',
            loadComponent: () => import('./components/user-social/promotions/promotions.component').then(m => m.PromotionsComponent),
            data: { title: 'Promotions' }
          },
          {
            path: '',
            redirectTo: 'posts',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'abonnements',
        loadComponent: () => import('./components/user-abonnement/user-abonnement.component').then(m => m.UserAbonnementComponent),
        data: { title: 'Subscriptions' }
      },
      {
        path: 'fidelities',
        loadComponent: () => import('./components/user-fidelity/user-fidelity.component').then(m => m.UserFidelityComponent),
        data: { title: 'Loyalty' }
      },
      {
        path: 'watchparty',
        loadComponent: () => import('./components/watchparty/watchparty.component').then(m => m.WatchPartyComponent),
        data: { title: 'WatchParty' }
      },
      {
        path: 'feedback',
        loadComponent: () => import('./components/feedback/feedback.component').then(m => m.FeedbackComponent),
        data: { title: 'Feedback' }
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },

  // Default route
  {
    path: 'watchparty/:id',
    loadComponent: () => import('./components/watchparty-session/watchparty-session.component').then(m => m.WatchpartySessionComponent),
    data: { title: 'WatchParty Session' }
  },

  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Wildcard route for 404
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

