# 🔄 Profile Service - Migration Guide: Mock to Backend

## Overview

This guide helps you transition the Profile Service from mock data to real API calls. The code is organized to make the migration simple and safe.

---

## Current State: Mock Data

### Location
`frontend/src/app/services/profile.service.ts`

### Current Structure
```typescript
export class ProfileService {
  constructor() {}
  
  getUserProfiles(userId: string): Observable<UserProfile[]> {
    // Returns mock data using of()
    return of([
      { id: 'profile_1', name: 'mayssen', type: 'ADULT', ... },
      { id: 'profile_2', name: 'Enfants', type: 'KIDS', ... }
    ]);
  }
}
```

---

## Target State: API Calls

### Location
`frontend/src/app/services/profile.service-api.ts`

### Target Structure
```typescript
export class ProfileService {
  constructor(private http: HttpClient) {}
  
  getUserProfiles(userId: string): Observable<UserProfile[]> {
    // Real API call
    return this.http.get<UserProfile[]>(
      `${this.apiUrl}/user/${userId}`
    );
  }
}
```

---

## Migration Steps

### Step 1: Update ProfileService Constructor

**Before:**
```typescript
constructor() {}
```

**After:**
```typescript
constructor(private http: HttpClient) {}
```

---

### Step 2: Replace Mock Methods with API Calls

#### getUserProfiles()

**Before:**
```typescript
getUserProfiles(userId: string): Observable<UserProfile[]> {
  return of([
    {
      id: 'profile_1',
      userId: userId,
      name: 'mayssen',
      type: 'ADULT',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adult-avatar',
      color: '#4D96FF',
      isDefault: true
    },
    {
      id: 'profile_2',
      userId: userId,
      name: 'Enfants',
      type: 'KIDS',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kids-avatar',
      color: '#FF6B9D',
      isDefault: false
    }
  ]);
}
```

**After:**
```typescript
getUserProfiles(userId: string): Observable<UserProfile[]> {
  return this.http.get<UserProfile[]>(`${this.apiUrl}/user/${userId}`);
}
```

---

#### createProfile()

**Before:**
```typescript
createProfile(request: CreateProfileRequest): Observable<UserProfile> {
  const newProfile: UserProfile = {
    id: 'profile_' + Math.random().toString(36).substr(2, 9),
    userId: 'user_123',
    name: request.name,
    type: request.type,
    avatar: this.getDefaultAvatar(request.type),
    color: this.getColorForType(request.type),
    isDefault: false
  };
  return of(newProfile);
}
```

**After:**
```typescript
createProfile(userId: string, request: CreateProfileRequest): Observable<UserProfile> {
  return this.http.post<UserProfile>(
    `${this.apiUrl}/user/${userId}`,
    request
  );
}
```

---

### Step 3: Update Component Usage

#### profile-selection.component.ts

**Before:**
```typescript
loadProfiles(): void {
  this.profileService.getUserProfiles('user_123').subscribe({
    next: (profiles) => {
      this.profiles.set(profiles);
      this.isLoading.set(false);
    },
    error: (error) => {
      console.error('Error loading profiles:', error);
      this.isLoading.set(false);
    }
  });
}

createProfile(): void {
  const request: CreateProfileRequest = {
    name: this.newProfileName(),
    type: this.newProfileType() as ProfileType
  };
  
  this.profileService.createProfile(request).subscribe({
    next: (newProfile) => {
      this.profiles.update(profiles => [...profiles, newProfile]);
      this.closeAddProfileModal();
    },
    error: (error) => console.error('Error creating profile:', error)
  });
}
```

**After:**
```typescript
loadProfiles(): void {
  const userId = this.authService.getCurrentUserId();
  if (!userId) return;
  
  this.profileService.getUserProfiles(userId).subscribe({
    next: (profiles) => {
      this.profiles.set(profiles);
      this.isLoading.set(false);
    },
    error: (error) => {
      console.error('Error loading profiles:', error);
      this.isLoading.set(false);
    }
  });
}

createProfile(): void {
  const userId = this.authService.getCurrentUserId();
  if (!userId) return;
  
  const request: CreateProfileRequest = {
    name: this.newProfileName(),
    type: this.newProfileType() as ProfileType
  };
  
  this.profileService.createProfile(userId, request).subscribe({
    next: (newProfile) => {
      this.profiles.update(profiles => [...profiles, newProfile]);
      this.closeAddProfileModal();
    },
    error: (error) => console.error('Error creating profile:', error)
  });
}
```

---

### Step 4: Verify Routes

Make sure `app.routes.ts` has:
```typescript
{
  path: 'auth/select-profile',
  loadComponent: () => import('./components/auth/profile-selection.component')
    .then(m => m.ProfileSelectionComponent),
  canActivate: [AuthGuard] // Add guard if needed
}
```

---

## Testing the Migration

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
```

Wait for: `Application started in X seconds`

### 2. Start Frontend
```bash
cd frontend
ng serve
```

### 3. Test Login Flow
1. Go to `http://localhost:4200/auth/login`
2. Login with valid credentials
3. Should redirect to profile selection
4. Profiles should load from API
5. Click "Create Profile" to test POST
6. Delete profile to test DELETE

### 4. Check Network Tab
- Open DevTools (F12)
- Go to Network tab
- Click on profile selection
- Verify API calls:
  - `GET /api/profiles/user/user_123` (200 OK)
  - Response shows profile data

---

## Error Handling

### Add Error Interceptor (Optional)

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => new Error(error.message));
      })
    );
  }
}
```

---

## Fallback Strategy

If you want to keep both mock and API:

```typescript
export class ProfileService {
  private useMock = false; // Toggle for testing

  getUserProfiles(userId: string): Observable<UserProfile[]> {
    if (this.useMock) {
      return of(mockProfiles);
    }
    return this.http.get<UserProfile[]>(`${this.apiUrl}/user/${userId}`);
  }
}
```

---

## Quick Reference

| Method | Before | After |
|--------|--------|-------|
| `getUserProfiles()` | `of([...])` | `http.get(...)` |
| `createProfile()` | `of(newProfile)` | `http.post(...)` |
| `updateProfile()` | `of(updated)` | `http.put(...)` |
| `deleteProfile()` | `of(null)` | `http.delete(...)` |

---

## Checklist

- [ ] Update ProfileService constructor
- [ ] Replace all `of()` calls with `http.get/post/put/delete()`
- [ ] Update method signatures (add userId parameter)
- [ ] Update component method calls
- [ ] Add getUserId() calls from AuthService
- [ ] Test login → profile selection flow
- [ ] Check Network tab for API calls
- [ ] Verify error handling works
- [ ] Test CRUD operations
- [ ] Clean up mock data (optional)

---

## Rollback Plan

If you need to rollback to mock data:
1. Keep original `profile.service.ts` in git
2. Use feature flags to toggle
3. Add debug logging to trace issues

---

## Additional Notes

- The backend API must be running on `http://localhost:8080`
- Profile responses from API should match `UserProfile` interface
- CORS must be enabled (already done in controller)
- JWT token should be automatically sent via interceptor

---

**Migration Guide Version**: 1.0  
**Last Updated**: May 2, 2026
