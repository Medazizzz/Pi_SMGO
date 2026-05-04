# 🎮 Kids Zone - Installation & Integration Guide

## 📦 Quick Setup

### Frontend Setup

#### 1. **Verify Files Created**
```
frontend/src/app/
├── components/kids/
│   ├── kids.component.ts
│   ├── kids.component.html
│   ├── kids.component.css
│   └── README.md
├── services/
│   └── kids.service.ts
└── models/
    └── kids.model.ts
```

#### 2. **Routes Already Added**
Check `app.routes.ts` - these routes have been added:
```typescript
{
  path: 'kids',
  loadComponent: () => import('./components/kids/kids.component').then(m => m.KidsComponent),
  data: { title: 'Kids Zone' }
},
{
  path: 'user/kids',
  loadComponent: () => import('./components/kids/kids.component').then(m => m.KidsComponent),
  data: { title: 'Kids Zone' }
}
```

#### 3. **Start Frontend Server**
```bash
cd frontend
npm install
ng serve
```

Access at: `http://localhost:4200/kids`

---

### Backend Setup

#### 1. **Verify Backend Files Created**
```
backend/src/main/java/com/example/contentmanagement/
├── controller/
│   └── KidsContentController.java
├── dto/
│   └── KidsContentDTO.java
├── entity/
│   └── KidsContent.java
├── repository/
│   └── KidsContentRepository.java
└── service/
    ├── KidsContentService.java
    └── impl/
        └── KidsContentServiceImpl.java
```

#### 2. **Database Migration**
The SQL file has been created at:
```
backend/src/main/resources/db/migration/V001__CreateKidsContent.sql
```

If using Flyway (recommended):
- The file will be automatically executed on application startup
- Make sure Flyway is configured in `application.properties`:

```properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

Or manually run the SQL:
```bash
mysql -u root -p your_database < V001__CreateKidsContent.sql
```

#### 3. **Verify Dependencies**
Ensure `pom.xml` has these dependencies:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

#### 4. **Start Backend Server**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend API will be available at: `http://localhost:8080/api/kids`

---

## 🧪 Test the API

### Test Endpoints

#### Get All Content
```bash
curl http://localhost:8080/api/kids/content
```

#### Get Featured Content
```bash
curl http://localhost:8080/api/kids/featured
```

#### Get Content by Age Group
```bash
curl http://localhost:8080/api/kids/age-group/6-9
curl http://localhost:8080/api/kids/age-group/2-5
curl http://localhost:8080/api/kids/age-group/10-13
curl http://localhost:8080/api/kids/age-group/FAMILY
```

#### Get Content by Type
```bash
curl http://localhost:8080/api/kids/type/ANIMATION
curl http://localhost:8080/api/kids/type/MOVIE
curl http://localhost:8080/api/kids/type/SERIES
curl http://localhost:8080/api/kids/type/EDUCATIONAL
```

#### Search Content
```bash
curl "http://localhost:8080/api/kids/search?query=adventure"
```

#### Get Recent Content
```bash
curl "http://localhost:8080/api/kids/recent?limit=10"
```

#### Create New Content (Admin)
```bash
curl -X POST http://localhost:8080/api/kids \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Adventure",
    "description": "An amazing new adventure",
    "ageGroup": "6-9",
    "contentType": "ANIMATION",
    "rating": 4.8,
    "duration": "25 min",
    "image": "https://example.com/image.jpg",
    "genre": "Adventure",
    "isEducational": true,
    "featured": true
  }'
```

---

## 🎨 Customization

### Change Colors
Edit `kids.component.css`:

```css
/* Primary colors */
--primary-pink: #FF6B9D;
--primary-purple: #9B59B6;
--primary-blue: #4D96FF;
--accent-yellow: #FFD93D;
```

### Add More Content
Update `kids.service.ts` in the `kidsContent` array:

```typescript
{
  id: '7',
  title: 'Your Content Title',
  description: 'Description here',
  ageGroup: '6-9',
  contentType: 'ANIMATION',
  rating: 4.9,
  duration: '22 min',
  image: 'https://your-image-url.jpg',
  genre: 'Adventure',
  characters: ['Character 1', 'Character 2'],
  isEducational: true,
  releasedYear: 2024,
  featured: true,
}
```

### Customize Animations
Edit `kids.component.css`:

```css
@keyframes float {
  /* Adjust the animation timing and distance */
  50% {
    transform: translateY(-30px) rotate(5deg);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

---

## 🔧 Troubleshooting

### Issue: Component not loading
**Solution**: 
- Check if routes are correctly added to `app.routes.ts`
- Verify imports in component
- Check browser console for errors

### Issue: Styles not applying
**Solution**:
- Ensure Tailwind CSS is configured
- Check if CSS file is referenced correctly
- Clear browser cache (Ctrl+Shift+Delete)

### Issue: Service not injecting
**Solution**:
- Verify `providedIn: 'root'` in service
- Check HttpClient is provided in `app.config.ts`

### Issue: Backend API not responding
**Solution**:
- Check if Spring Boot is running
- Verify database connection
- Check CORS settings in controller (@CrossOrigin)
- Check API endpoints in browser Network tab

### Issue: Database tables not created
**Solution**:
- Run migration manually:
```bash
mysql -u root -p -e "source backend/src/main/resources/db/migration/V001__CreateKidsContent.sql"
```
- Or check Flyway configuration in `application.properties`

---

## 📱 Navigation Links

Add these links to your navigation menu:

### For Public Access
```html
<a routerLink="/kids">Kids Zone</a>
```

### For Authenticated Users
```html
<a routerLink="/user/kids">Kids Zone</a>
```

### In TypeScript
```typescript
this.router.navigate(['/kids']);
// or
this.router.navigate(['/user/kids']);
```

---

## 🚀 Next Steps

1. **Add Parental Controls**
   - PIN protection
   - Age restrictions
   - Screen time limits

2. **Add Watch History**
   - Track watched content
   - Continue watching
   - Recommendations

3. **Add Streaming Integration**
   - Netflix API
   - Disney+ API
   - Direct streaming

4. **Add Social Features**
   - Ratings and reviews
   - Favorites sync
   - Sharing

5. **Add Analytics**
   - Track user behavior
   - Content popularity
   - Recommendations engine

---

## 📚 Additional Resources

- [Kids Component README](./frontend/src/app/components/kids/README.md)
- [Kids Model Definition](./frontend/src/app/models/kids.model.ts)
- [Kids Service](./frontend/src/app/services/kids.service.ts)
- [Backend Controller](./backend/src/main/java/com/example/contentmanagement/controller/KidsContentController.java)

---

## ✅ Checklist

- [ ] Frontend files created
- [ ] Routes added to `app.routes.ts`
- [ ] Backend files created
- [ ] Database tables created
- [ ] Dependencies verified
- [ ] Frontend server running
- [ ] Backend server running
- [ ] API endpoints tested
- [ ] Navigation links added
- [ ] Customization completed

---

## 💡 Tips

1. **Mobile Testing**: Use Chrome DevTools device emulation to test on mobile
2. **Performance**: Cache API responses using Angular's caching mechanism
3. **Accessibility**: Test with screen readers
4. **SEO**: Add proper metadata for content
5. **Analytics**: Track user interactions

---

## 🆘 Support

If you encounter issues:
1. Check error messages in browser console
2. Check backend logs in terminal
3. Verify all files are created
4. Ensure database is running
5. Check network requests in DevTools

---

**Version**: 1.0.0  
**Created**: May 2, 2026  
**Status**: Ready for Integration ✅
