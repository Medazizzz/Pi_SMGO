# 👥 Profile Selection System - Documentation

## 📋 Overview

Le système de sélection de profils permet aux utilisateurs de choisir quel profil utiliser après connexion, exactement comme Netflix, Shahid ou Disney+. Cela supporte plusieurs profils par compte (adulte, enfants, ados, etc.).

## 🎯 Features

### 1. **Profile Selection**
- Affiche tous les profils de l'utilisateur après login
- Interface belle et interactive
- Redirection automatique au profil sélectionné

### 2. **Profile Management**
- Créer nouveaux profils
- Supprimer profils
- Marquer un profil par défaut
- Gérer les paramètres des profils

### 3. **Profile Types**
- **ADULT** (👤) - Profil adulte
- **KIDS** (🎮) - Profil enfants
- **TEEN** (👨) - Profil adolescent

### 4. **Parental Controls** (Ready to implement)
- Protection par PIN
- Restrictions d'âge
- Limites de temps d'écran
- Contrôle du contenu

## 📁 Files Created

```
frontend/src/app/
├── components/auth/
│   ├── profile-selection.component.ts
│   ├── profile-selection.component.html
│   └── profile-selection.component.css
├── services/
│   └── profile.service.ts
└── models/
    └── profile.model.ts
```

## 🔄 Flow

```
Login (username/password)
        ↓
Authentication Success
        ↓
Redirect to /auth/select-profile
        ↓
Display User Profiles
        ↓
User Selects Profile
        ↓
Store Profile Selection
        ↓
Navigate to:
  - Kids Zone (if KIDS profile)
  - Home Page (if ADULT profile)
  - Home Page (if TEEN profile)
```

## 🚀 Usage

### 1. **Access Profile Selection**

Après login réussi, l'utilisateur est automatiquement redirigé vers:
```
http://localhost:4200/auth/select-profile
```

### 2. **Create a Profile**

```typescript
const newProfile = {
  name: 'Mon Enfant',
  type: 'KIDS'
};

this.profileService.createProfile(newProfile).subscribe(
  profile => console.log('Profile created:', profile)
);
```

### 3. **Get User Profiles**

```typescript
const userId = this.authService.getCurrentUserId();
this.profileService.getUserProfiles(userId).subscribe(
  profiles => console.log('Profiles:', profiles)
);
```

### 4. **Select Profile**

```typescript
// The component handles this automatically
// Just click on a profile card to select it
selectProfile(profile: UserProfile) {
  localStorage.setItem('selectedProfile', JSON.stringify(profile));
  
  if (profile.type === 'KIDS') {
    this.router.navigate(['/user/kids']);
  } else {
    this.router.navigate(['/user/home']);
  }
}
```

## 📊 Data Models

### UserProfile
```typescript
{
  id: string;
  userId: string;
  name: string;
  type: ProfileType;      // 'ADULT' | 'KIDS' | 'TEEN'
  avatar: string;         // Avatar URL
  color?: string;         // Theme color
  isDefault?: boolean;
  ageRestriction?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### ProfileSelectionData
```typescript
{
  userId: string;
  profiles: UserProfile[];
  selectedProfileId?: string;
}
```

## 🎨 Design Features

### Colors per Profile Type
- **ADULT**: `#4D96FF` (Blue)
- **KIDS**: `#FF6B9D` (Pink)
- **TEEN**: `#FFD93D` (Yellow)

### Animations
- Fade in/up on load
- Scale on hover
- Smooth transitions
- Staggered card animations

### Responsive Design
- Mobile: 2 columns
- Tablet: Auto-fit 200px columns
- Desktop: Full grid

## 🔧 Integration with Backend

### Database Schema

```sql
CREATE TABLE user_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20),
  avatar_url VARCHAR(500),
  color VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  age_restriction INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id)
);

CREATE TABLE profile_favorites (
  id VARCHAR(36) PRIMARY KEY,
  profile_id VARCHAR(36) NOT NULL,
  content_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES user_profiles(id),
  UNIQUE KEY uk_profile_content (profile_id, content_id)
);
```

### API Endpoints (To implement)

```
GET    /api/profiles/user/{userId}        - Get all profiles
GET    /api/profiles/{profileId}          - Get single profile
POST   /api/profiles                      - Create profile
PUT    /api/profiles/{profileId}          - Update profile
DELETE /api/profiles/{profileId}          - Delete profile
PUT    /api/profiles/{profileId}/default  - Set default profile
```

### Spring Boot Controller Template

```java
@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProfileDTO>> getUserProfiles(
            @PathVariable String userId) {
        return ResponseEntity.ok(profileService.getUserProfiles(userId));
    }

    @PostMapping
    public ResponseEntity<ProfileDTO> createProfile(
            @RequestBody CreateProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.createProfile(request));
    }

    @PutMapping("/{profileId}")
    public ResponseEntity<ProfileDTO> updateProfile(
            @PathVariable String profileId,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(profileId, request));
    }

    @DeleteMapping("/{profileId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String profileId) {
        profileService.deleteProfile(profileId);
        return ResponseEntity.noContent().build();
    }
}
```

## 🔒 Security

### Current State (Mock Data)
- No authentication check
- Using localStorage for storage
- Mock profiles for demo

### Production Implementation
- Validate user authorization
- Verify profile ownership
- Use secure token storage
- Implement parental PIN validation
- Rate limiting on profile operations

## 📱 Mobile Optimization

- Touch-friendly buttons
- Large tap targets
- Responsive grid
- Optimized spacing
- Clear visual feedback

## ♿ Accessibility

- High contrast colors
- Large fonts
- Keyboard navigation ready
- Screen reader friendly
- ARIA labels (can be added)

## 🎬 Next Steps

### Phase 1: Current ✅
- Profile selection interface
- Mock data
- Navigation flow

### Phase 2: Backend Integration
- Connect to REST API
- Database persistence
- User validation

### Phase 3: Advanced Features
- Parental controls
- PIN protection
- Watch history per profile
- Separate favorites per profile

### Phase 4: Customization
- Custom profile avatars
- Theme customization
- Profile-specific settings

## 🧪 Testing

### Unit Tests
```typescript
describe('ProfileSelectionComponent', () => {
  it('should load user profiles on init', () => {
    component.ngOnInit();
    expect(component.profiles().length).toBeGreaterThan(0);
  });

  it('should navigate to kids zone when kids profile selected', () => {
    const kidsProfile: UserProfile = { 
      type: 'KIDS' 
    };
    component.selectProfile(kidsProfile);
    expect(router.navigate).toHaveBeenCalledWith(['/user/kids']);
  });
});
```

### Integration Tests
```typescript
it('should show profile selection after login', () => {
  // Login
  authService.login(credentials);
  
  // Verify redirect to select-profile
  expect(router.navigate).toHaveBeenCalledWith(['/auth/select-profile']);
  
  // Verify profiles loaded
  expect(profileService.getUserProfiles).toHaveBeenCalled();
});
```

## 🐛 Troubleshooting

### Issue: Profiles not loading
**Solution**: Check that `ProfileService.getUserProfiles()` is called with correct userId

### Issue: Navigation not working after profile selection
**Solution**: Verify routes in `app.routes.ts` are correct

### Issue: Profile modal not closing
**Solution**: Check that `showAddProfileModal` signal is properly toggled

### Issue: Avatars not displaying
**Solution**: Verify image URLs are accessible (using DiceBear API)

## 📞 Support

For issues or questions:
1. Check the component console for errors
2. Verify browser localStorage is enabled
3. Check network tab for failed API calls
4. Review component lifecycle methods

## 📚 Resources

- [Profile Model Definition](./models/profile.model.ts)
- [Profile Service](./services/profile.service.ts)
- [Component Implementation](./components/auth/profile-selection.component.ts)

---

**Version**: 1.0.0  
**Created**: May 2, 2026  
**Status**: Ready to Use ✅
