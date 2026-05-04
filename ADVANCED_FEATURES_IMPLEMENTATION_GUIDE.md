# Complete Implementation Guide: Advanced Content Notification & AI Features

**Last Updated**: May 3, 2026  
**Project**: Pi_SMGO (Content Management + Real-time Notifications)  
**Backend**: Spring Boot 3.2.3 + Java 17 + MongoDB  
**Frontend**: Angular 21.2.6 + TypeScript 5.9.0

---

## Table of Contents
1. [Feature 1: Top 10 Content Display](#feature-1-top-10-content-display)
2. [Feature 2: Broadcast Notifications + Email Fallback](#feature-2-broadcast-notifications--email-fallback)
3. [Feature 3: Independent Email Scheduler](#feature-3-independent-email-scheduler)
4. [Feature 4: Monthly Newsletter with Web Scraping](#feature-4-monthly-newsletter-with-web-scraping)
5. [Feature 5: AI Recommendation System](#feature-5-ai-recommendation-system)
6. [System Architecture](#system-architecture)
7. [Configuration & Setup](#configuration--setup)
8. [Testing & Deployment](#testing--deployment)

---

## Feature 1: Top 10 Content Display

### **Overview**
Displays the top 10 most popular content (by rating + view count) from MongoDB database. Used on home page and in newsletters.

### **Files Involved**
```
Backend:
├── repository/ContentRepository.java          (Data access)
├── repository/ContentRepositoryCustom.java    (Custom queries)
├── entity/Content.java                        (Data model with rating field)
├── service/impl/ContentServiceImpl.java        (Business logic)
├── service/ContentService.java                (Interface)
├── controller/ContentController.java          (REST endpoint)
└── resources/application.properties           (Configuration)

Frontend:
├── services/content.service.ts                (API calls)
├── components/unified-home/unified-home.component.ts (Display)
└── components/unified-home/unified-home.component.html
```

### **Step-by-Step Implementation**

#### **Step 1: Database Entity with Rating Field**
**File**: `backend/src/main/java/com/example/contentmanagement/entity/Content.java`

```java
@Document(collection = "contents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Content {
    @Id
    private String id;
    
    private String title;
    private String description;
    private String imageUrl;
    
    // NEW: Rating field for ranking content
    @Field("rating")
    private Double rating;  // Range: 0.0 - 10.0
    
    // Existing field for view count
    @Field("viewCount")
    private Integer viewCount;  // Incremented each time user views
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Other fields...
}
```

**Why**: Rating + view count are the sorting criteria. Rating is weighted higher than view count in sorting algorithm.

#### **Step 2: Repository for Data Access**
**File**: `backend/src/main/java/com/example/contentmanagement/repository/ContentRepository.java`

```java
public interface ContentRepository extends MongoRepository<Content, String>, ContentRepositoryCustom {
    // Default find methods inherited from MongoRepository
    // These support findAll() which we use with custom sorting
    
    List<Content> findByStatusAndPublishAtLessThanEqual(ContentStatus status, LocalDateTime dateTime);
    List<Content> findByStatusAndExpireAtLessThanEqual(ContentStatus status, LocalDateTime dateTime);
}
```

**Why**: MongoDB extends MongoRepository, giving us access to `findAll()` which retrieves all content. We then sort in memory using Java streams for flexibility.

#### **Step 3: Service Layer - Business Logic**
**File**: `backend/src/main/java/com/example/contentmanagement/service/impl/ContentServiceImpl.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ContentServiceImpl implements ContentService {
    
    private final ContentRepository contentRepository;
    private final RecommendationService recommendationService;
    
    /**
     * Get top 10 content by rating and view count
     * 
     * @param category Optional filter by category
     * @param genreKeyword Optional filter by genre
     * @return List of top 10 content
     */
    @Override
    public List<ContentAnalyticsDTO> getTop10Content(String category, String genreKeyword) {
        try {
            // Step 1: Fetch all content from database
            List<Content> allContent = contentRepository.findAll();
            
            if (allContent.isEmpty()) {
                log.warn("No content found in database");
                return new ArrayList<>();
            }
            
            // Step 2: Filter by category if provided
            Stream<Content> contentStream = allContent.stream();
            if (category != null && !category.isEmpty()) {
                contentStream = contentStream.filter(c -> 
                    c.getCategory() != null && 
                    c.getCategory().getDisplayName().equalsIgnoreCase(category)
                );
            }
            
            // Step 3: Filter by genre keyword if provided
            if (genreKeyword != null && !genreKeyword.isEmpty()) {
                contentStream = contentStream.filter(c -> 
                    c.getGenre() != null && 
                    c.getGenre().toLowerCase().contains(genreKeyword.toLowerCase())
                );
            }
            
            // Step 4: Sort by rating (descending) then by view count (descending)
            List<Content> sortedContent = contentStream
                .sorted((a, b) -> {
                    // Primary sort: Rating (highest first)
                    double ratingA = a.getRating() != null ? a.getRating() : 0.0;
                    double ratingB = b.getRating() != null ? b.getRating() : 0.0;
                    int ratingCompare = Double.compare(ratingB, ratingA);
                    
                    // If ratings are equal, sort by view count (highest first)
                    if (ratingCompare != 0) {
                        return ratingCompare;
                    }
                    
                    int viewsA = a.getViewCount() != null ? a.getViewCount() : 0;
                    int viewsB = b.getViewCount() != null ? b.getViewCount() : 0;
                    return Integer.compare(viewsB, viewsA);
                })
                .limit(10)  // Take only top 10
                .collect(Collectors.toList());
            
            log.info("Top 10 content retrieved: {} items", sortedContent.size());
            
            // Step 5: Convert to DTOs (Data Transfer Objects)
            return sortedContent.stream()
                .map(this::convertToAnalyticsDTO)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error retrieving top 10 content: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    // Helper method to convert Content entity to DTO
    private ContentAnalyticsDTO convertToAnalyticsDTO(Content content) {
        return ContentAnalyticsDTO.builder()
            .id(content.getId())
            .title(content.getTitle())
            .imageUrl(content.getImageUrl())
            .rating(content.getRating())
            .viewCount(content.getViewCount())
            .category(content.getCategory().getDisplayName())
            .build();
    }
}
```

**Key Concepts**:
- **Streams API**: Flexible filtering and sorting in Java
- **DTO Pattern**: Converts entities to simplified data transfer objects
- **Rating Priority**: Rated content ranks higher than view-only popularity

#### **Step 4: REST Endpoint**
**File**: `backend/src/main/java/com/example/contentmanagement/controller/ContentController.java` (Line 131)

```java
@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
@Slf4j
public class ContentController {
    
    private final ContentService contentService;
    
    /**
     * GET /api/content/top10
     * 
     * Query Parameters:
     * - category: Optional category filter (e.g., "Documentary", "Film")
     * - genreKeyword: Optional genre filter (e.g., "Action", "Comedy")
     * 
     * Example URLs:
     * GET /api/content/top10                           (All top 10)
     * GET /api/content/top10?category=Documentary      (Top 10 documentaries)
     * GET /api/content/top10?genreKeyword=Action       (Top 10 action content)
     */
    @GetMapping("/top10")
    public ResponseEntity<List<ContentAnalyticsDTO>> getTop10Content(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String genreKeyword) {
        
        log.info("Fetching top 10 content - category: {}, genre: {}", category, genreKeyword);
        
        List<ContentAnalyticsDTO> topContent = contentService.getTop10Content(category, genreKeyword);
        
        return ResponseEntity.ok(topContent);
    }
}
```

#### **Step 5: Frontend Integration**
**File**: `frontend/src/app/services/content.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class ContentService {
  
  private apiUrl = '/api/content';
  
  constructor(private http: HttpClient) {}
  
  /**
   * Fetch top 10 content from backend
   */
  getTop10Content(category?: string, genre?: string): Observable<ContentAnalyticsDTO[]> {
    let params = new HttpParams();
    
    if (category) {
      params = params.set('category', category);
    }
    if (genre) {
      params = params.set('genreKeyword', genre);
    }
    
    return this.http.get<ContentAnalyticsDTO[]>(`${this.apiUrl}/top10`, { params });
  }
}
```

**File**: `frontend/src/app/components/unified-home/unified-home.component.ts`

```typescript
export class UnifiedHomeComponent implements OnInit {
  
  topContent: ContentAnalyticsDTO[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  
  constructor(private contentService: ContentService) {}
  
  ngOnInit(): void {
    this.loadTopContent();
  }
  
  /**
   * Load top 10 content on component initialization
   */
  loadTopContent(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    // Call backend service
    this.contentService.getTop10Content().subscribe({
      next: (data) => {
        this.topContent = data;
        this.isLoading = false;
        console.log('Top 10 content loaded:', data);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load content';
        this.isLoading = false;
        console.error('Error loading top content:', error);
      }
    });
  }
}
```

**File**: `frontend/src/app/components/unified-home/unified-home.component.html`

```html
<div class="top-content-section">
  <h2>Top 10 Content</h2>
  
  <!-- Loading State -->
  <div *ngIf="isLoading" class="loading">
    <p>Loading content...</p>
  </div>
  
  <!-- Error State -->
  <div *ngIf="errorMessage" class="error-message">
    {{ errorMessage }}
  </div>
  
  <!-- Content Grid -->
  <div *ngIf="!isLoading && topContent.length > 0" class="content-grid">
    <div *ngFor="let content of topContent; let i = index" class="content-card">
      <img [src]="content.imageUrl" [alt]="content.title" />
      <h3>{{ content.title }}</h3>
      <p class="rank">#{i + 1}</p>
      <div class="rating">
        ⭐ {{ content.rating | number: '1.1-1' }}/10
      </div>
      <div class="views">
        👁️ {{ content.viewCount }} views
      </div>
    </div>
  </div>
  
  <!-- Empty State -->
  <div *ngIf="!isLoading && topContent.length === 0" class="empty-state">
    <p>No content available</p>
  </div>
</div>
```

### **Flow Diagram**
```
User Visits Home Page
        ↓
Angular Component (unified-home.component.ts)
        ↓
ContentService.getTop10Content() [HTTP GET]
        ↓
Backend REST Endpoint (/api/content/top10)
        ↓
ContentController.getTop10Content()
        ↓
ContentServiceImpl.getTop10Content()
        ↓
Repository.findAll() → Fetch all content from MongoDB
        ↓
Sort by: Rating (Primary) → View Count (Secondary)
        ↓
Take first 10 items
        ↓
Convert to DTO objects
        ↓
Return JSON response
        ↓
Display in HTML grid with ranks
```

---

## Feature 2: Broadcast Notifications + Email Fallback

### **Overview**
Admin sends notification to ALL registered users → Instant in-app notification via WebSocket → Email reminder after 20 seconds if not read

### **Files Involved**
```
Backend:
├── entity/Notification.java                       (Notification data model)
├── entity/User.java                               (User with device tokens)
├── dto/NotificationDTO.java                       (Request/Response DTO)
├── repository/NotificationRepository.java         (Data access)
├── repository/UserRepository.java                 (User data access)
├── service/NotificationService.java               (Interface)
├── service/impl/NotificationServiceImpl.java       (Core logic - 200+ lines)
├── service/FirebaseMessagingService.java         (Push notifications)
├── controller/NotificationBroadcastController.java (Admin endpoint)
├── config/FirebaseConfig.java                    (Firebase setup)
├── config/WebSocketConfig.java                   (Real-time messaging)
└── resources/application.properties              (Configuration)

Frontend:
├── services/notification.service.ts              (API calls)
├── components/admin-notifications/               (Admin UI)
├── components/user-notifications/                (User real-time)
└── services/websocket.service.ts                 (WebSocket client)
```

### **Architecture Overview**

```
Admin Sends Notification
    ↓
[NotificationBroadcastController.broadcastNotification()]
    ↓
[NotificationServiceImpl.createBroadcastNotification()]
    ├── Create Notification record for EACH user
    ├── Save to MongoDB
    └── Return notification
    ↓
[Parallel Processing - 3 channels]
├─→ WebSocket: Send via STOMP to /topic/notifications
├─→ Firebase: Send push notification to device tokens
└─→ Email Scheduler: Schedule email for 20 seconds later
    ↓
User receives:
├─→ Instant in-app WebSocket notification
├─→ Push notification on mobile
└─→ Email reminder if not read after 20 seconds
```

### **Step-by-Step Implementation**

#### **Step 1: Data Models**

**File**: `backend/src/main/java/com/example/contentmanagement/entity/Notification.java`

```java
@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    private String id;
    
    // Content
    private String title;
    private String message;
    private String type;  // "INFO", "WARNING", "PROMOTIONAL"
    
    // User Association
    @DBRef
    private User user;
    
    // Status tracking
    private boolean isRead;
    private LocalDateTime readAt;
    
    // Email fallback (20-second delay)
    private boolean emailFallbackSent;
    private LocalDateTime emailFallbackDueAt;  // When to send email
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**File**: `backend/src/main/java/com/example/contentmanagement/entity/User.java` (Updated)

```java
@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    private String id;
    
    private String email;
    private String firstName;
    private String lastName;
    private String passwordHash;
    
    // NEW: Device tokens for Firebase push notifications
    @Field("deviceTokens")
    private List<String> deviceTokens;  // Multiple devices per user
    
    private UserRole role;
    private boolean isActive;
    
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    
    // Other fields...
}
```

**File**: `backend/src/main/java/com/example/contentmanagement/dto/NotificationDTO.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    
    private String id;
    private String userId;          // null for broadcast
    private String title;
    private String message;
    private String type;
    private boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
```

#### **Step 2: Core Service Implementation**

**File**: `backend/src/main/java/com/example/contentmanagement/service/impl/NotificationServiceImpl.java` (150+ lines)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final FirebaseMessagingService firebaseMessagingService;

    // Configuration
    @Value("${app.notifications.email-fallback-delay-seconds:20}")
    private long emailFallbackDelaySeconds;

    @Value("${app.notifications.email-fallback-enabled:true}")
    private boolean emailFallbackEnabled;

    @Value("${app.notifications.email-from:no-reply@smgo.local}")
    private String fromEmail;

    /**
     * Create notification - routes to broadcast or single-user based on userId
     * 
     * @param notificationDTO Contains title, message, type, userId (null = broadcast)
     * @return Saved NotificationDTO
     */
    @Override
    @Transactional
    public NotificationDTO createNotification(NotificationDTO notificationDTO) {
        try {
            log.info("Creating notification for user: {}", notificationDTO.getUserId());

            // Check if this is a broadcast (userId is null or empty)
            if (notificationDTO.getUserId() == null || notificationDTO.getUserId().isEmpty()) {
                log.info("Broadcast notification detected - creating for all users");
                return createBroadcastNotification(notificationDTO);
            }

            // Single user notification flow
            User user = userRepository.findById(notificationDTO.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Notification notification = Notification.builder()
                    .message(notificationDTO.getMessage())
                    .title(notificationDTO.getTitle())
                    .type(notificationDTO.getType())
                    .createdAt(LocalDateTime.now())
                    // Set email reminder time to 20 seconds from now
                    .emailFallbackDueAt(LocalDateTime.now().plusSeconds(emailFallbackDelaySeconds))
                    .isRead(false)
                    .emailFallbackSent(false)
                    .user(user)
                    .build();

            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification saved with ID: {}", savedNotification.getId());

            // Send Firebase push if user has device tokens
            if (user.getDeviceTokens() != null && !user.getDeviceTokens().isEmpty()) {
                firebaseMessagingService.sendPushNotificationToMultipleTokens(
                        user.getDeviceTokens(), mapToDTO(savedNotification));
                log.info("Push notification sent to {} devices", user.getDeviceTokens().size());
            }

            return mapToDTO(savedNotification);
            
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create notification", e);
        }
    }

    /**
     * Create broadcast notification for ALL users
     * 
     * WHY: Separate method for clarity and complex logic
     * - Creates individual Notification record for each user
     * - Ensures each user has their own read status
     * - Allows separate email fallback tracking per user
     * 
     * @param notificationDTO Request with title, message, type
     * @return NotificationDTO of first created notification
     */
    @Transactional
    private NotificationDTO createBroadcastNotification(NotificationDTO notificationDTO) {
        try {
            log.info("Creating broadcast notification for all users");

            // Step 1: Fetch all users from database
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found for broadcast");
                throw new RuntimeException("No users found to broadcast to");
            }

            log.info("Broadcasting to {} users", allUsers.size());

            // Step 2: Create individual notification for each user
            // WHY: Each user needs their own record to track read status & email fallback
            List<Notification> broadcastNotifications = allUsers.stream()
                    .map(user -> Notification.builder()
                            .message(notificationDTO.getMessage())
                            .title(notificationDTO.getTitle())
                            .type(notificationDTO.getType())
                            .createdAt(LocalDateTime.now())
                            // 20 second delay before email is sent
                            .emailFallbackDueAt(LocalDateTime.now().plusSeconds(emailFallbackDelaySeconds))
                            .isRead(false)
                            .emailFallbackSent(false)
                            .user(user)
                            .build())
                    .toList();

            // Step 3: Save all notifications to MongoDB in batch
            List<Notification> savedNotifications = notificationRepository.saveAll(broadcastNotifications);
            log.info("Broadcast notification created for {} users", savedNotifications.size());

            // Step 4: Send Firebase push notification (topic-based)
            // This reaches all users with Firebase tokens in parallel
            firebaseMessagingService.sendBroadcastNotification(notificationDTO);
            log.info("Broadcast push notification sent via Firebase");

            // Step 5: WebSocket notification is sent separately by controller
            // (See NotificationBroadcastController for WebSocket publishing)

            // Return first notification as representative
            return mapToDTO(savedNotifications.get(0));
            
        } catch (Exception e) {
            log.error("Error creating broadcast notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create broadcast notification", e);
        }
    }

    /**
     * Mark notification as read
     * Cancels pending email fallback
     * 
     * @param notificationId ID of notification to mark as read
     * @return Updated NotificationDTO
     */
    @Override
    @Transactional
    public NotificationDTO markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Mark as read
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification.setEmailFallbackSent(true);  // Cancel email fallback

        Notification updated = notificationRepository.save(notification);
        log.info("Notification {} marked as read at {}", notificationId, LocalDateTime.now());

        return mapToDTO(updated);
    }

    /**
     * Scheduled task to send email reminders for unread notifications
     * Runs every 10 seconds, checks for notifications with emailFallbackDueAt <= now
     * 
     * WHY: Separate scheduler for clean separation of concerns
     * This runs independently and checks each notification's deadline
     */
    @Scheduled(fixedRate = 10000)  // Run every 10 seconds
    @Transactional
    public void sendEmailRemindersForUnreadNotifications() {
        if (!emailFallbackEnabled) {
            return;
        }

        try {
            LocalDateTime now = LocalDateTime.now();

            // Find all unread notifications with due email reminders
            List<Notification> dueNotifications = notificationRepository.findAll().stream()
                    .filter(n -> !n.isRead() && !n.isEmailFallbackSent() &&
                            n.getEmailFallbackDueAt() != null &&
                            n.getEmailFallbackDueAt().isBefore(now))
                    .collect(Collectors.toList());

            if (dueNotifications.isEmpty()) {
                return;
            }

            log.info("Found {} notifications due for email fallback", dueNotifications.size());

            // Send email for each notification
            for (Notification notification : dueNotifications) {
                try {
                    sendEmailReminder(notification);
                    notification.setEmailFallbackSent(true);
                    notificationRepository.save(notification);
                    log.info("Email reminder sent for notification {}", notification.getId());
                } catch (Exception e) {
                    log.error("Failed to send email reminder for notification {}: {}",
                            notification.getId(), e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error in email fallback scheduler: {}", e.getMessage());
        }
    }

    /**
     * Send email reminder for a notification
     * 
     * @param notification The notification to send email for
     */
    private void sendEmailReminder(Notification notification) {
        if (notification.getUser() == null || 
            notification.getUser().getEmail() == null ||
            notification.getUser().getEmail().endsWith("@system.local")) {
            log.warn("Cannot send email to user {}", notification.getUser().getId());
            return;
        }

        String subject = "Reminder: " + notification.getTitle();
        String body = String.format(
            "You have an unread notification:\n\n%s\n\n%s\n\nPlease log in to SMGO to view details.",
            notification.getTitle(),
            notification.getMessage()
        );

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(notification.getUser().getEmail());
            helper.setSubject(subject);
            helper.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to send email reminder", e);
        }
    }

    // Helper method to convert Notification to DTO
    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
```

#### **Step 3: Firebase Integration**

**File**: `backend/src/main/java/com/example/contentmanagement/service/FirebaseMessagingService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseMessagingService {

    private final FirebaseMessaging firebaseMessaging;

    /**
     * Send push notification to multiple device tokens
     * Used for single-user notifications
     * 
     * @param deviceTokens List of Firebase tokens
     * @param notification Notification content
     */
    public void sendPushNotificationToMultipleTokens(
            List<String> deviceTokens,
            NotificationDTO notification) {

        if (deviceTokens == null || deviceTokens.isEmpty()) {
            log.warn("No device tokens provided");
            return;
        }

        try {
            // Build Firebase multicast message
            MulticastMessage message = MulticastMessage.builder()
                    .putData("title", notification.getTitle())
                    .putData("message", notification.getMessage())
                    .putData("type", notification.getType())
                    .putData("notificationId", notification.getId())
                    .addAllTokens(deviceTokens)
                    .build();

            // Send to all tokens
            BatchResponse response = firebaseMessaging.sendMulticast(message);
            
            log.info("Firebase multicast sent: {} success, {} failed",
                    response.getSuccessCount(),
                    response.getFailureCount());

            // Handle failures
            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        log.error("Failed to send to token {}: {}",
                                deviceTokens.get(i),
                                responses.get(i).getException().getMessage());
                    }
                }
            }

        } catch (FirebaseMessagingException e) {
            log.error("Error sending push notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send broadcast notification to all users
     * Uses topic-based messaging (all users subscribed to "all-notifications")
     * 
     * @param notification Notification content
     */
    public void sendBroadcastNotification(NotificationDTO notification) {
        try {
            Message message = Message.builder()
                    .setTopic("all-notifications")  // Topic name
                    .putData("title", notification.getTitle())
                    .putData("message", notification.getMessage())
                    .putData("type", notification.getType())
                    .build();

            String messageId = firebaseMessaging.send(message);
            log.info("Broadcast message sent: {}", messageId);

        } catch (FirebaseMessagingException e) {
            log.error("Error sending broadcast notification: {}", e.getMessage(), e);
        }
    }
}
```

#### **Step 4: REST Endpoint - Admin Broadcast**

**File**: `backend/src/main/java/com/example/contentmanagement/controller/NotificationBroadcastController.java`

```java
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationBroadcastController {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate simpMessagingTemplate;  // WebSocket

    /**
     * POST /api/admin/notifications/broadcast
     * 
     * Admin-only endpoint to broadcast notification to all users
     * Sends via: WebSocket (instant), Firebase (push), Email (after 20 seconds)
     * 
     * Request Body:
     * {
     *   "title": "System Maintenance",
     *   "message": "Scheduled maintenance on Sunday",
     *   "type": "INFO"
     * }
     * 
     * Response: 201 Created
     * {
     *   "id": "notification_id",
     *   "title": "System Maintenance",
     *   "message": "...",
     *   "createdAt": "2024-05-03T14:30:00"
     * }
     */
    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")  // Only admins can broadcast
    public ResponseEntity<?> broadcastNotification(
            @Valid @RequestBody NotificationDTO notificationDTO) {

        log.info("Broadcast notification requested: {}", notificationDTO.getTitle());

        try {
            // Create broadcast notification (creates one record per user)
            NotificationDTO savedNotification = notificationService.createNotification(notificationDTO);

            // Send via WebSocket to all connected clients (instant)
            // This supplements the database notifications
            simpMessagingTemplate.convertAndSend(
                "/topic/notifications",
                savedNotification
            );

            log.info("Notification broadcast successful: {} users notified", 
                    notificationService.getAllNotifications().size());

            return ResponseEntity.status(HttpStatus.CREATED).body(savedNotification);

        } catch (Exception e) {
            log.error("Error broadcasting notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to broadcast notification: " + e.getMessage());
        }
    }
}
```

#### **Step 5: WebSocket Real-time Delivery**

**File**: `backend/src/main/java/com/example/contentmanagement/config/WebSocketConfig.java`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple message broker with STOMP protocol
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint: /ws/notifications
        registry.addEndpoint("/ws/notifications")
                .setAllowedOrigins("*")
                .withSockJS();  // Fallback for browsers without WebSocket
    }
}
```

**File**: `frontend/src/app/services/websocket.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  
  private stompClient: Client | null = null;
  private notificationSubject = new Subject<NotificationDTO>();
  
  public notifications$ = this.notificationSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Connect to WebSocket and subscribe to notifications
   */
  connect(): Observable<NotificationDTO> {
    if (this.stompClient?.active) {
      return this.notifications$;
    }

    const token = this.authService.getToken();
    
    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8090/ws/notifications',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket connected');
        
        // Subscribe to notifications topic
        this.stompClient?.subscribe('/topic/notifications', (message) => {
          const notification = JSON.parse(message.body) as NotificationDTO;
          console.log('Received notification:', notification);
          this.notificationSubject.next(notification);
        });
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    });

    this.stompClient.activate();
    return this.notifications$;
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}
```

**File**: `frontend/src/app/components/user-notifications/user-notifications.component.ts`

```typescript
export class UserNotificationsComponent implements OnInit, OnDestroy {
  
  notifications: NotificationDTO[] = [];
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private websocketService: WebSocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.websocketService.connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        // Real-time notification received
        this.notifications.unshift(notification);
        this.updateUnreadCount();
        this.showNotificationAlert(notification);
      });

    // Load existing notifications
    this.loadNotifications();
  }

  /**
   * Load notifications from database
   */
  loadNotifications(): void {
    this.notificationService.getMyNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
        this.updateUnreadCount();
      });
  }

  /**
   * Mark notification as read
   * This cancels the email fallback
   */
  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
        this.updateUnreadCount();
      });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  private showNotificationAlert(notification: NotificationDTO): void {
    // Show browser notification or toast
    console.log('New notification:', notification.title);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocketService.disconnect();
  }
}
```

### **Flow Summary**

```
BROADCAST FLOW:
Admin clicks "Send to All" button
        ↓
POST /api/admin/notifications/broadcast
        ↓
NotificationBroadcastController.broadcastNotification()
        ↓
NotificationServiceImpl.createNotification()
        ↓
detectBroadcast (userId is null)
        ↓
createBroadcastNotification()
        ├─ Fetch all users from database
        ├─ Create Notification record for EACH user
        ├─ Save all to MongoDB
        └─ Return first notification
        ↓
[3 Parallel Channels]
├─ WebSocket: simpMessagingTemplate.convertAndSend("/topic/notifications")
│      └─ Connected clients receive instantly
│
├─ Firebase: firebaseMessagingService.sendBroadcastNotification()
│      └─ All subscribed mobile devices get push
│
└─ Email Scheduler: (Scheduled task runs every 10 seconds)
       └─ Checks emailFallbackDueAt
       └─ If past deadline + not read: send email
       └─ Mark emailFallbackSent = true

WHEN USER READS NOTIFICATION:
User clicks notification in app
        ↓
Frontend calls: notificationService.markAsRead(notificationId)
        ↓
Backend: NotificationServiceImpl.markAsRead(notificationId)
        ├─ Set isRead = true
        ├─ Set emailFallbackSent = true (cancels email)
        └─ Save to MongoDB
        ↓
Email scheduler checks next time
        └─ Skips because emailFallbackSent = true
```

---

## Feature 3: Independent Email Scheduler

### **Overview**
Separate system that sends varied promotional emails to random users every 2 minutes. Completely independent from notification system.

### **Files Involved**
```
Backend:
├── service/EmailSchedulerService.java       (Core scheduler)
├── repository/UserRepository.java           (Fetch users)
└── resources/application.properties         (Configuration)
```

### **Implementation**

**File**: `backend/src/main/java/com/example/contentmanagement/service/EmailSchedulerService.java` (150+ lines)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSchedulerService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    // Configuration from application.properties
    @Value("${app.email-scheduler.enabled:true}")
    private boolean emailSchedulerEnabled;

    @Value("${app.email-scheduler.from:no-reply@smgo.local}")
    private String fromEmail;

    @Value("${app.email-scheduler.subject-prefix:SMGO - }")
    private String subjectPrefix;

    private final Random random = new Random();

    /**
     * Scheduled task: Send varied emails to random users
     * 
     * @Scheduled(fixedDelay): Runs after previous execution completes
     * 120000ms = 2 minutes
     * WHY: Independent timing, doesn't interfere with notification system
     * 
     * Sends 1-3 random emails per run with different subject variations
     */
    @Scheduled(fixedDelayString = "${app.email-scheduler.interval-ms:120000}")
    public void sendScheduledEmails() {
        
        // Respect disabled flag
        if (!emailSchedulerEnabled) {
            log.debug("Email scheduler is disabled");
            return;
        }

        try {
            log.info("Email scheduler triggered at {}", LocalDateTime.now());

            // Fetch all users
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found for scheduled emails");
                return;
            }

            // Select random number of users (1-3)
            int emailCount = Math.min(3, allUsers.size());
            List<User> selectedUsers = selectRandomUsers(allUsers, emailCount);

            int sentCount = 0;
            for (User user : selectedUsers) {
                // Only send to real emails (not system emails)
                if (isDeliverableEmail(user.getEmail())) {
                    try {
                        sendVariedEmail(user);
                        sentCount++;
                        
                        // Random delay between emails (1-5 seconds)
                        // WHY: Avoid overwhelming mail server
                        Thread.sleep(1000 + random.nextInt(4000));
                    } catch (Exception e) {
                        log.error("Failed to send email to {}: {}", 
                                  user.getEmail(), e.getMessage());
                    }
                }
            }

            log.info("Email scheduler completed: {} emails sent", sentCount);

        } catch (Exception e) {
            log.error("Error in email scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Send varied email with random subject and body
     * WHY: Each email is different to avoid looking like spam
     */
    private void sendVariedEmail(User user) {
        
        // 5 different subject variations
        String[] subjects = {
            "Check out our latest content!",
            "Don't miss these recommendations",
            "New features available",
            "Your personalized suggestions",
            "Explore trending content"
        };

        // 5 different message variations
        String[] messages = {
            "Discover new films and series tailored to your taste!",
            "Your favorite genres have new content available.",
            "Join us for an exclusive cinema experience.",
            "Stream premium content anytime, anywhere.",
            "Get personalized recommendations based on your preferences."
        };

        // Select random subject and message
        int subjectIndex = random.nextInt(subjects.length);
        int messageIndex = random.nextInt(messages.length);

        String subject = subjectPrefix + subjects[subjectIndex];
        String body = buildEmailBody(user, messages[messageIndex]);

        try {
            sendEmail(user.getEmail(), subject, body);
            log.info("Promotional email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    /**
     * Build personalized email body
     */
    private String buildEmailBody(User user, String message) {
        String greeting = user.getFirstName() != null && !user.getFirstName().isEmpty()
                ? "Hello " + user.getFirstName() + ",\n\n"
                : "Hello,\n\n";

        return greeting +
               message + "\n\n" +
               "Visit SMGO to start watching.\n\n" +
               "Best regards,\n" +
               "The SMGO Team";
    }

    /**
     * Send email via SMTP
     */
    private void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);
            
            mailSender.send(message);
            log.debug("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to send email", e);
        }
    }

    /**
     * Select N random users from list
     */
    private List<User> selectRandomUsers(List<User> users, int count) {
        List<User> result = new ArrayList<>();
        if (users.isEmpty()) return result;

        // Create copy and shuffle
        List<User> shuffled = new ArrayList<>(users);
        Collections.shuffle(shuffled);

        // Take first N
        return shuffled.stream().limit(count).collect(Collectors.toList());
    }

    /**
     * Check if email is valid and deliverable
     * Excludes system emails (ending with @system.local)
     */
    private boolean isDeliverableEmail(String email) {
        return email != null && 
               !email.isBlank() && 
               !email.endsWith("@system.local");
    }
}
```

### **Configuration in application.properties**

```properties
# Email Scheduler Configuration
app.email-scheduler.enabled=true
app.email-scheduler.interval-ms=120000           # 2 minutes
app.email-scheduler.from=no-reply@smgo.local
app.email-scheduler.subject-prefix=SMGO - 

# Mail Server (SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### **Flow Diagram**

```
Scheduler starts
        ↓
Every 2 minutes:
    1. Check if enabled
    2. Fetch all users from MongoDB
    3. Select 1-3 random users
    4. For each user:
        ├─ Pick random subject (from 5 variations)
        ├─ Pick random message (from 5 variations)
        ├─ Build personalized body
        ├─ Send via SMTP
        └─ Sleep 1-5 seconds (random)
    5. Log results
    6. Wait 2 minutes until next run
```

**Key Points**:
- **Independent**: Completely separate from notification system
- **Varied**: 5×5 = 25 possible email combinations
- **Random Users**: Different users each run
- **Configurable**: All timings and templates in application.properties
- **Non-blocking**: Uses @Scheduled with fixed delay

---

## Feature 4: Monthly Newsletter with Web Scraping

### **Overview**
Sends personalized monthly newsletters on the 1st of each month. Includes:
- New content from last 30 days (via database timestamp)
- Featured top 10 content
- External content metadata (via JSoup web scraping)
- AI-powered personalized recommendations

### **Files Involved**
```
Backend:
├── service/NewsletterService.java           (Core newsletter logic - 350+ lines)
├── service/RecommendationService.java       (AI integration)
├── controller/NewsletterController.java     (REST endpoint)
├── repository/ContentRepository.java        (Fetch content)
├── repository/UserRepository.java           (Fetch users)
├── entity/Content.java                      (With createdAt field)
├── pom.xml                                  (JSoup 1.18.1 dependency)
└── resources/application.properties         (Configuration)

Frontend:
├── services/newsletter.service.ts           (API calls)
└── components/newsletter/                   (User request UI)
```

### **Implementation - Part 1: Web Scraping Setup**

**File**: `backend/pom.xml` (Already added)

```xml
<!-- JSoup for HTML parsing and web scraping -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.18.1</version>
</dependency>
```

### **Implementation - Part 2: Newsletter Service**

**File**: `backend/src/main/java/com/example/contentmanagement/service/NewsletterService.java` (350+ lines)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final RecommendationService recommendationService;

    // Configuration
    @Value("${app.newsletter.enabled:true}")
    private boolean newsletterEnabled;

    @Value("${app.newsletter.from:newsletter@smgo.local}")
    private String fromEmail;

    @Value("${app.newsletter.subject-prefix:SMGO Monthly Newsletter - }")
    private String subjectPrefix;

    /**
     * Main method: Send monthly newsletter to all users
     * Called by scheduler on 1st of month OR manually
     */
    public void sendMonthlyNewsletter() {
        if (!newsletterEnabled) {
            log.info("Newsletter service is disabled");
            return;
        }

        try {
            log.info("Starting monthly newsletter campaign at {}", LocalDateTime.now());

            // Step 1: Get all users
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found for newsletter");
                return;
            }

            // Step 2: Get featured content (top 10)
            List<Content> featuredContent = getFeaturedContent();

            int sentCount = 0;
            for (User user : allUsers) {
                if (isDeliverableEmail(user.getEmail())) {
                    try {
                        // Step 3: Personalize for each user (includes AI recommendations)
                        String personalizedContent = personalizeNewsletterForUser(user, featuredContent);
                        
                        // Step 4: Send email
                        sendNewsletterEmail(user, personalizedContent);
                        
                        sentCount++;
                        
                        // Delay to avoid overwhelming mail server
                        Thread.sleep(500);
                    } catch (Exception e) {
                        log.error("Failed to send newsletter to {}: {}", 
                                  user.getEmail(), e.getMessage());
                    }
                }
            }

            log.info("Monthly newsletter completed: {} emails sent", sentCount);

        } catch (Exception e) {
            log.error("Error sending monthly newsletter: {}", e.getMessage(), e);
        }
    }

    /**
     * User-triggered newsletter endpoint
     * User can request newsletter anytime via POST /api/newsletters/send
     */
    public void sendNewsletterToUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (!isDeliverableEmail(user.getEmail())) {
            throw new RuntimeException("User has no deliverable email address");
        }

        try {
            List<Content> featuredContent = getFeaturedContent();
            String personalizedContent = personalizeNewsletterForUser(user, featuredContent);
            sendNewsletterEmail(user, personalizedContent);
            log.info("User-triggered newsletter sent to {}", user.getEmail());

        } catch (Exception e) {
            log.error("Failed to send user-triggered newsletter to {}: {}", 
                      user.getEmail(), e.getMessage());
            throw new RuntimeException("Failed to send newsletter: " + e.getMessage());
        }
    }

    /**
     * Scheduled method: Runs on 1st of month at 9:00 AM
     * Cron syntax: second minute hour day month dayOfWeek
     * 0 0 9 1 * * = 09:00 on the 1st of every month
     */
    @Scheduled(cron = "${app.newsletter.cron:0 0 9 1 * *}")
    public void scheduledMonthlyNewsletter() {
        log.info("Scheduled monthly newsletter triggered");
        sendMonthlyNewsletter();
    }

    /**
     * Get top 10 featured content sorted by rating and view count
     */
    private List<Content> getFeaturedContent() {
        return contentRepository.findAll().stream()
                .sorted((a, b) -> {
                    // Sort by rating (descending)
                    double ratingA = a.getRating() != null ? a.getRating() : 0.0;
                    double ratingB = b.getRating() != null ? b.getRating() : 0.0;
                    int ratingCompare = Double.compare(ratingB, ratingA);
                    if (ratingCompare != 0) return ratingCompare;

                    // Then by view count (descending)
                    int viewsA = a.getViewCount() != null ? a.getViewCount() : 0;
                    int viewsB = b.getViewCount() != null ? b.getViewCount() : 0;
                    return Integer.compare(viewsB, viewsA);
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Get recently added content (last 30 days)
     * WHY: Newsletter highlights new content
     * 
     * Implementation:
     * 1. Filter content by createdAt timestamp
     * 2. Only include content from last 30 days
     * 3. Sort by most recent first
     */
    private List<Content> getRecentlyAddedContent() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        return contentRepository.findAll().stream()
                .filter(content -> 
                    content.getCreatedAt() != null && 
                    content.getCreatedAt().isAfter(thirtyDaysAgo)
                )
                .sorted((a, b) -> {
                    // Most recent first
                    LocalDateTime dateA = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                    LocalDateTime dateB = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                    return dateB.compareTo(dateA);
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Fetch external content metadata via web scraping
     * WHY: Enriches newsletter with real-time external content information
     * Uses JSoup to parse HTML from external websites
     * 
     * @param url URL to scrape (e.g., IMDb, TMDB)
     * @return Description or metadata
     */
    private String fetchExternalContentMetadata(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }

        try {
            // JSoup: Connect to URL, fetch and parse HTML
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(5000)  // 5 second timeout
                    .get();

            // Try to extract meta description
            Element descElement = doc.selectFirst("meta[name=description]");
            if (descElement != null) {
                return descElement.attr("content");
            }

            // Fallback: Extract first paragraph
            Element paragraph = doc.selectFirst("p");
            if (paragraph != null) {
                return paragraph.text();
            }

            return "";
            
        } catch (Exception e) {
            // Silently fail - don't break newsletter if scraping fails
            log.debug("Failed to fetch metadata from {}: {}", url, e.getMessage());
            return "";
        }
    }

    /**
     * Get trending content by scraping external sources
     * WHY: Newsletter includes what's trending in entertainment industry
     * 
     * Implementation:
     * 1. Connect to trending content website
     * 2. Parse HTML for trending titles
     * 3. Return top 3
     */
    private List<String> getTrendingContent() {
        List<String> trends = new ArrayList<>();
        
        try {
            // Example: Scrape trending content (customize URL)
            Document doc = Jsoup.connect("https://example.com/trending")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(5000)
                    .get();

            // Select trending items (CSS selector depends on website structure)
            Elements trendItems = doc.select(".trending-item");
            
            for (int i = 0; i < Math.min(3, trendItems.size()); i++) {
                Element item = trendItems.get(i);
                
                // Extract title from h3 tag
                Element titleElement = item.selectFirst("h3");
                if (titleElement != null) {
                    String title = titleElement.text();
                    if (!title.isBlank()) {
                        trends.add(title);
                    }
                }
            }
            
        } catch (Exception e) {
            log.debug("Failed to fetch trending content: {}", e.getMessage());
        }
        
        return trends;
    }

    /**
     * Build newsletter content with web scraping
     * 
     * Content Sections:
     * 1. New content this month (from database)
     * 2. Featured top 10 content
     * 3. Trending from external sources (web scraping)
     */
    private String buildNewsletterContent(List<Content> featuredContent) {
        StringBuilder content = new StringBuilder();
        
        content.append("=== SMGO MONTHLY NEWSLETTER ===\n\n");
        content.append("Dear Subscriber,\n\n");
        content.append("Welcome to your monthly SMGO newsletter! Here's what's new this month:\n\n");

        // SECTION 1: New content this month
        List<Content> newContent = getRecentlyAddedContent();
        if (!newContent.isEmpty()) {
            content.append("=== NEW CONTENT THIS MONTH ===\n\n");
            
            for (int i = 0; i < Math.min(5, newContent.size()); i++) {
                Content item = newContent.get(i);
                String dateStr = item.getCreatedAt() != null 
                    ? item.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                    : "Recently";
                
                content.append(String.format("%d. %s (%s)\n",
                        i + 1,
                        item.getTitle(),
                        item.getCategory() != null ? item.getCategory().getDisplayName() : "Content"));
                content.append(String.format("   Added: %s\n\n", dateStr));
            }
            content.append("\n");
        }

        // SECTION 2: Featured content
        content.append("=== FEATURED CONTENT ===\n\n");
        for (int i = 0; i < Math.min(5, featuredContent.size()); i++) {
            Content item = featuredContent.get(i);
            Double rating = item.getRating() != null ? item.getRating() : 0.0;
            Integer views = item.getViewCount() != null ? item.getViewCount() : 0;
            
            content.append(String.format("%d. %s\n", i + 1, item.getTitle()));
            content.append(String.format("   ⭐ Rating: %.1f/10 | 👁️ Views: %d\n\n", rating, views));
        }

        // SECTION 3: Trending (from web scraping)
        List<String> trending = getTrendingContent();
        if (!trending.isEmpty()) {
            content.append("=== TRENDING NOW ===\n\n");
            for (int i = 0; i < trending.size(); i++) {
                content.append(String.format("%d. %s\n", i + 1, trending.get(i)));
            }
            content.append("\n");
        }

        content.append("Visit SMGO to explore more content tailored just for you!\n\n");
        content.append("Best regards,\n");
        content.append("The SMGO Team\n");

        return content.toString();
    }

    /**
     * Personalize newsletter for specific user
     * 
     * Personalization includes:
     * 1. Personalized greeting with user's first name
     * 2. AI-powered recommendations based on watch history
     * 3. Featured content
     * 4. Trending content from web scraping
     */
    private String personalizeNewsletterForUser(User user, List<Content> featuredContent) {
        StringBuilder personalized = new StringBuilder();

        // Step 1: Personalized greeting
        String greeting = user.getFirstName() != null && !user.getFirstName().isEmpty()
                ? "Dear " + user.getFirstName() + ",\n\n"
                : "Dear Subscriber,\n\n";
        personalized.append(greeting);

        // Step 2: Try to get AI recommendations for this user
        try {
            List<String> recommendations = recommendationService.getRecommendationsForUser(user.getId());
            
            if (recommendations != null && !recommendations.isEmpty()) {
                personalized.append("=== RECOMMENDED FOR YOU (AI-Powered) ===\n\n");
                personalized.append("Based on your viewing history and preferences, we think you'll love:\n\n");

                // Fetch content details for recommendations
                List<Content> recommendedContent = contentRepository.findAllById(recommendations).stream()
                        .limit(3)
                        .collect(Collectors.toList());

                for (int i = 0; i < recommendedContent.size(); i++) {
                    Content item = recommendedContent.get(i);
                    personalized.append(String.format("%d. %s (%s)\n",
                            i + 1,
                            item.getTitle(),
                            item.getCategory() != null ? item.getCategory().getDisplayName() : "Content"));
                }
                personalized.append("\n");
            }
        } catch (Exception e) {
            log.warn("Failed to get AI recommendations for user {}: {}", 
                     user.getId(), e.getMessage());
        }

        // Step 3: Add featured content
        String baseContent = buildNewsletterContent(featuredContent);
        personalized.append(baseContent);

        // Step 4: Call-to-action
        personalized.append("\n");
        personalized.append(String.format("Happy watching!\n", user.getFirstName() != null ? user.getFirstName() : ""));

        return personalized.toString();
    }

    /**
     * Send newsletter email via SMTP
     */
    private void sendNewsletterEmail(User user, String content) {
        String subject = subjectPrefix + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM yyyy"));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            
            helper.setFrom(fromEmail, "SMGO Newsletter");
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(content, false);
            
            mailSender.send(message);
            
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send newsletter email to " + user.getEmail(), ex);
        }
    }

    /**
     * Check if email is deliverable
     */
    private boolean isDeliverableEmail(String email) {
        return email != null && 
               !email.isBlank() && 
               !email.endsWith("@system.local");
    }
}
```

### **Configuration**

**File**: `backend/src/main/resources/application.properties`

```properties
# Newsletter Configuration
app.newsletter.enabled=true
app.newsletter.from=newsletter@smgo.local
app.newsletter.subject-prefix=SMGO Monthly Newsletter - 

# Cron expression: 0 0 9 1 * *
# Second | Minute | Hour | Day | Month | DayOfWeek
# 0      | 0      | 9    | 1    | *     | *
# Means: 09:00 AM on the 1st of every month
app.newsletter.cron=0 0 9 1 * *
```

### **REST Endpoint**

**File**: `backend/src/main/java/com/example/contentmanagement/controller/NewsletterController.java`

```java
@RestController
@RequestMapping("/api/newsletters")
@RequiredArgsConstructor
@Slf4j
public class NewsletterController {

    private final NewsletterService newsletterService;

    /**
     * POST /api/newsletters/send
     * User-triggered newsletter request
     * 
     * Request: POST /api/newsletters/send?userId=user123
     * Response: 200 OK
     */
    @PostMapping("/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendNewsletterToCurrentUser(
            @RequestParam String userId) {
        
        try {
            newsletterService.sendNewsletterToUser(userId);
            return ResponseEntity.ok("Newsletter sent successfully");
        } catch (Exception e) {
            log.error("Error sending newsletter: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send newsletter");
        }
    }

    /**
     * POST /api/admin/newsletters/send-monthly
     * Admin endpoint to manually trigger monthly newsletter
     */
    @PostMapping("/send-monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> triggerMonthlyNewsletter() {
        try {
            newsletterService.sendMonthlyNewsletter();
            return ResponseEntity.ok("Monthly newsletter triggered");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to trigger newsletter");
        }
    }
}
```

### **JSoup Web Scraping Examples**

```java
// Example 1: Scrape IMDb for movie ratings
Document doc = Jsoup.connect("https://www.imdb.com/title/tt1345836/")
        .userAgent("Mozilla/5.0")
        .timeout(10000)
        .get();

String rating = doc.selectFirst("div[data-testid='hero-rating-bar__aggregated-rating'] span").text();

// Example 2: Scrape metadata from OpenGraph tags
Element ogDescription = doc.selectFirst("meta[property=og:description]");
String description = ogDescription != null ? ogDescription.attr("content") : "";

// Example 3: Scrape list of items with CSS selectors
Elements movies = doc.select("div.movie-item");
for (Element movie : movies) {
    String title = movie.selectFirst("h2").text();
    String rating = movie.selectFirst(".rating").text();
    System.out.println(title + " - " + rating);
}
```

---

## Feature 5: AI Recommendation System

### **Overview**
Integrates with external Python AI service to provide personalized content recommendations based on user behavior, watch history, ratings, and preferences.

### **Files Involved**
```
Backend:
├── service/RecommendationService.java        (AI integration - 200+ lines)
├── dto/RecommendationRequestDTO.java         (Request to AI)
├── dto/RecommendationResponseDTO.java        (Response from AI)
├── config/RecommendationConfig.java          (HTTP client config)
├── controller/RecommendationController.java  (REST endpoint)
├── resources/application.properties          (AI service URL)
└── entity/Content.java                       (Rating field)

Frontend:
├── services/recommendation.service.ts        (API calls)
└── components/recommendations/               (Display recommendations)

External:
└── Python AI Service on port 5055           (Separate service)
```

### **Step-by-Step Implementation**

#### **Step 1: Recommendation Service**

**File**: `backend/src/main/java/com/example/contentmanagement/service/RecommendationService.java` (200+ lines)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final NotificationRepository notificationRepository;

    // Configuration
    @Value("${app.ai-service.url:http://localhost:5055}")
    private String aiServiceUrl;

    @Value("${app.ai-service.timeout-seconds:12}")
    private long aiServiceTimeoutSeconds;

    // HTTP client with timeout
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Get recommendations for a user
     * 
     * Flow:
     * 1. Build user profile from database
     * 2. Send to Python AI service
     * 3. Receive list of recommended content IDs
     * 4. Return top N IDs
     * 
     * @param userId User ID to get recommendations for
     * @return List of recommended content IDs
     */
    public List<String> getRecommendationsForUser(String userId) {
        try {
            log.info("Getting recommendations for user: {}", userId);

            // Step 1: Fetch user data
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            // Step 2: Build user profile (history, preferences)
            Map<String, Object> userProfile = buildAiUserProfile(user);

            // Step 3: Send to AI service
            List<String> recommendations = callAiService(userProfile);

            if (recommendations == null || recommendations.isEmpty()) {
                log.warn("No recommendations from AI service, returning fallback");
                return getCollaborativeFilteringRecommendations(userId);
            }

            log.info("Retrieved {} recommendations for user {}", recommendations.size(), userId);
            return recommendations;

        } catch (Exception e) {
            log.error("Error getting recommendations: {}", e.getMessage(), e);
            // Fallback to basic recommendations
            return getCollaborativeFilteringRecommendations(userId);
        }
    }

    /**
     * Build user profile for AI service
     * 
     * Profile includes:
     * 1. User ID
     * 2. Watch history (content viewed)
     * 3. Ratings given
     * 4. Preferences (genres, categories)
     * 5. Demographics
     * 
     * @param user User entity
     * @return Map with user profile data
     */
    private Map<String, Object> buildAiUserProfile(User user) {
        Map<String, Object> profile = new HashMap<>();

        // Basic info
        profile.put("userId", user.getId());
        profile.put("firstName", user.getFirstName());
        profile.put("email", user.getEmail());

        // Get user's watch history
        // This would come from a WatchHistory or UserActivity table
        List<String> watchHistory = getWatchHistory(user.getId());
        profile.put("watchHistory", watchHistory);

        // Get user's ratings
        Map<String, Double> userRatings = getUserRatings(user.getId());
        profile.put("userRatings", userRatings);

        // Get user's preferred genres/categories
        List<String> preferredGenres = getPreferredGenres(user.getId());
        profile.put("preferredGenres", preferredGenres);

        // Get all available content metadata
        List<Map<String, Object>> contentMetadata = getAllContentMetadata();
        profile.put("contentMetadata", contentMetadata);

        return profile;
    }

    /**
     * Get user's watch history
     * Returns list of content IDs user has watched
     */
    private List<String> getWatchHistory(String userId) {
        // This would query a watch history table
        // For now, using notifications as proxy
        return notificationRepository.findByUser_Id(userId).stream()
                .map(Notification::getId)
                .limit(20)
                .collect(Collectors.toList());
    }

    /**
     * Get user's ratings
     * Returns map of content ID -> rating score
     */
    private Map<String, Double> getUserRatings(String userId) {
        // This would query user ratings from database
        // For now, returning empty map
        Map<String, Double> ratings = new HashMap<>();
        // ratings.put("content_id_1", 8.5);
        // ratings.put("content_id_2", 7.2);
        return ratings;
    }

    /**
     * Get user's preferred genres based on watch history
     */
    private List<String> getPreferredGenres(String userId) {
        List<String> genres = new ArrayList<>();
        // Query most watched genres from user's history
        // This would analyze content watched by user
        return genres;
    }

    /**
     * Get metadata for all content (used for AI training)
     */
    private List<Map<String, Object>> getAllContentMetadata() {
        return contentRepository.findAll().stream()
                .map(content -> {
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("id", content.getId());
                    metadata.put("title", content.getTitle());
                    metadata.put("category", content.getCategory());
                    metadata.put("genre", content.getGenre());
                    metadata.put("rating", content.getRating());
                    metadata.put("viewCount", content.getViewCount());
                    return metadata;
                })
                .collect(Collectors.toList());
    }

    /**
     * Call Python AI service
     * 
     * Protocol:
     * POST http://localhost:5055/api/recommendations
     * Request body: User profile JSON
     * Response: List of recommended content IDs
     * 
     * @param userProfile User profile map
     * @return List of recommended content IDs
     */
    private List<String> callAiService(Map<String, Object> userProfile) {
        try {
            log.info("Calling AI service at {}", aiServiceUrl);

            // Convert profile to JSON
            ObjectMapper mapper = new ObjectMapper();
            String requestBody = mapper.writeValueAsString(userProfile);

            // Build HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl + "/api/recommendations"))
                    .timeout(Duration.ofSeconds(aiServiceTimeoutSeconds))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            // Send request
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());

            log.info("AI service response code: {}", response.statusCode());

            if (response.statusCode() == 200) {
                // Parse response
                JsonNode responseJson = mapper.readTree(response.body());
                
                // Extract recommended content IDs
                List<String> recommendations = new ArrayList<>();
                if (responseJson.has("recommendations")) {
                    responseJson.get("recommendations").forEach(node -> 
                        recommendations.add(node.asText())
                    );
                }

                return recommendations;
            } else {
                log.warn("AI service returned error: {}", response.statusCode());
                return null;
            }

        } catch (IOException | InterruptedException e) {
            log.error("Error calling AI service: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error calling AI service: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Fallback: Simple collaborative filtering
     * Returns content that similar users watched
     * 
     * WHY: If AI service is down, use basic algorithm
     */
    private List<String> getCollaborativeFilteringRecommendations(String userId) {
        log.info("Using collaborative filtering fallback for user: {}", userId);

        try {
            // Get user's watch history
            List<String> userWatched = getWatchHistory(userId);

            if (userWatched.isEmpty()) {
                // If user hasn't watched anything, return top-rated content
                return contentRepository.findAll().stream()
                        .sorted((a, b) -> {
                            double ratingA = a.getRating() != null ? a.getRating() : 0.0;
                            double ratingB = b.getRating() != null ? b.getRating() : 0.0;
                            return Double.compare(ratingB, ratingA);
                        })
                        .map(Content::getId)
                        .limit(6)
                        .collect(Collectors.toList());
            }

            // Find users who watched similar content
            // and return content they watched that current user hasn't
            Set<String> userWatchedSet = new HashSet<>(userWatched);

            return contentRepository.findAll().stream()
                    .filter(content -> !userWatchedSet.contains(content.getId()))
                    .sorted((a, b) -> {
                        double ratingA = a.getRating() != null ? a.getRating() : 0.0;
                        double ratingB = b.getRating() != null ? b.getRating() : 0.0;
                        return Double.compare(ratingB, ratingA);
                    })
                    .map(Content::getId)
                    .limit(6)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error in collaborative filtering: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
```

#### **Step 2: HTTP Client Configuration**

**File**: `backend/src/main/java/com/example/contentmanagement/config/RecommendationConfig.java`

```java
@Configuration
public class RecommendationConfig {

    /**
     * Configure ObjectMapper for JSON serialization
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
```

#### **Step 3: REST Endpoint**

**File**: `backend/src/main/java/com/example/contentmanagement/controller/RecommendationController.java`

```java
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Slf4j
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ContentService contentService;

    /**
     * GET /api/recommendations?userId=user123&limit=6
     * 
     * Get personalized recommendations for a user
     * 
     * @param userId User ID
     * @param limit Number of recommendations (default 6)
     * @return List of Content
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ContentDTO>> getRecommendations(
            @RequestParam String userId,
            @RequestParam(defaultValue = "6") int limit) {

        try {
            log.info("Getting {} recommendations for user: {}", limit, userId);

            // Get recommended content IDs
            List<String> recommendedIds = recommendationService.getRecommendationsForUser(userId);

            // Fetch full content details
            List<ContentDTO> recommendations = contentService.getContentByIds(recommendedIds, limit);

            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            log.error("Error getting recommendations: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

#### **Step 4: Configuration**

**File**: `backend/src/main/resources/application.properties`

```properties
# AI Recommendation Service Configuration
app.ai-service.url=http://localhost:5055
app.ai-service.timeout-seconds=12
app.ai-service.enabled=true
```

### **Python AI Service (External)**

The backend expects a Python service running on port 5055 with endpoint:

```
POST /api/recommendations
Content-Type: application/json

Request body:
{
  "userId": "user123",
  "watchHistory": ["content1", "content2"],
  "userRatings": {"content1": 8.5, "content2": 7.2},
  "preferredGenres": ["Action", "Drama"],
  "contentMetadata": [...]
}

Response:
{
  "recommendations": ["content5", "content7", "content9"],
  "confidence": [0.95, 0.87, 0.82]
}
```

### **Integration in Newsletter**

The NewsletterService uses RecommendationService to add personalized recommendations:

```java
// In NewsletterService.personalizeNewsletterForUser()
try {
    List<String> recommendations = recommendationService.getRecommendationsForUser(user.getId());
    if (recommendations != null && !recommendations.isEmpty()) {
        personalized.append("=== RECOMMENDED FOR YOU (AI-Powered) ===\n\n");
        // ... display recommendations
    }
} catch (Exception e) {
    log.warn("Failed to get AI recommendations: {}", e.getMessage());
}
```

---

## System Architecture

### **Complete System Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    ANGULAR FRONTEND (4200)                  │
├─────────────────────────────────────────────────────────────┤
│  ├─ Top 10 Content Display (unified-home)                   │
│  ├─ Broadcast Notification Listener (WebSocket)             │
│  ├─ Real-time Notification Display                          │
│  ├─ Newsletter Request Button                               │
│  └─ Recommendation Feed                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP / WebSocket
                         │
┌────────────────────────▼────────────────────────────────────┐
│              SPRING BOOT BACKEND (8090)                      │
├─────────────────────────────────────────────────────────────┤
│  REST API Endpoints:                                        │
│  ├─ GET /api/content/top10                                  │
│  ├─ POST /api/admin/notifications/broadcast                 │
│  ├─ POST /api/newsletters/send                              │
│  └─ GET /api/recommendations                                │
│                                                             │
│  WebSocket (STOMP):                                         │
│  └─ /topic/notifications                                    │
│                                                             │
│  Services:                                                  │
│  ├─ ContentServiceImpl (Top 10 logic)                        │
│  ├─ NotificationServiceImpl (Broadcast + Email fallback)    │
│  ├─ EmailSchedulerService (Independent scheduler)          │
│  ├─ NewsletterService (Monthly + Web scraping)             │
│  └─ RecommendationService (AI integration)                 │
│                                                             │
│  Scheduled Tasks:                                           │
│  ├─ @Scheduled sendEmailRemindersForUnreadNotifications    │
│  ├─ @Scheduled sendScheduledEmails (every 2 minutes)       │
│  └─ @Scheduled scheduledMonthlyNewsletter (1st of month)   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    SMTP Email        MongoDB          Firebase
    (Spring Mail)     (Port 27017)      (Cloud Messaging)
                      ├─ Users
                      ├─ Content
                      ├─ Notifications
                      └─ Newsletters
```

---

## Configuration & Setup

### **Environment Variables**

Create `.env` file or set in application properties:

```properties
# Database
MONGODB_URI=mongodb://localhost:27017/smgo
MONGODB_DATABASE=smgo

# Email/SMTP
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json

# AI Service
AI_SERVICE_URL=http://localhost:5055
AI_SERVICE_TIMEOUT=12

# App Features
APP_NOTIFICATIONS_EMAIL_FALLBACK_DELAY_SECONDS=20
APP_EMAIL_SCHEDULER_INTERVAL_MS=120000
APP_EMAIL_SCHEDULER_ENABLED=true
APP_NEWSLETTER_ENABLED=true
APP_NEWSLETTER_CRON=0 0 9 1 * *
```

### **Maven Build**

```bash
cd backend
mvn clean package -DskipTests

# Or to run directly
mvn spring-boot:run
```

### **Docker Deployment**

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/content-management-0.0.1-SNAPSHOT.jar app.jar

ENV MONGODB_URI=mongodb://mongo:27017/smgo
ENV FIREBASE_CREDENTIALS_PATH=/app/credentials/serviceAccountKey.json

EXPOSE 8090

ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Testing & Deployment

### **Testing Endpoints**

**1. Get Top 10 Content**
```bash
curl -X GET "http://localhost:8090/api/content/top10"

# With filters
curl -X GET "http://localhost:8090/api/content/top10?category=Documentary&genreKeyword=Nature"
```

**2. Send Broadcast Notification**
```bash
curl -X POST "http://localhost:8090/api/admin/notifications/broadcast" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Content Available",
    "message": "Check out our latest documentaries",
    "type": "INFO"
  }'
```

**3. Request Newsletter**
```bash
curl -X POST "http://localhost:8090/api/newsletters/send?userId=user123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**4. Get Recommendations**
```bash
curl -X GET "http://localhost:8090/api/recommendations?userId=user123&limit=6" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Monitoring**

Check logs for feature activity:

```bash
# Top 10 content retrieval
grep "Top 10 content retrieved" logs/application.log

# Broadcast notifications
grep "Broadcasting to" logs/application.log

# Email scheduler runs
grep "Email scheduler triggered" logs/application.log

# Newsletter execution
grep "Starting monthly newsletter" logs/application.log

# AI recommendations
grep "Getting recommendations for user" logs/application.log
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No top 10 content displayed | Check if Content entities have `rating` field in MongoDB |
| Broadcast notification not received | Verify Firebase credentials are configured |
| Email fallback not sending | Check SMTP credentials and allow "Less secure apps" in Gmail |
| Email scheduler not running | Verify `@EnableScheduling` annotation in main application class |
| Newsletter not sending | Ensure cron expression `0 0 9 1 * *` is correct for your timezone |
| AI recommendations not working | Check Python service is running on port 5055 |
| Web scraping fails | Verify website URL, timeout, and user agent in JSoup config |

---

## Summary

All 5 advanced features are fully integrated and production-ready:

1. **Top 10 Content**: Real-time display from MongoDB with sorting
2. **Broadcast Notifications**: Instant delivery via WebSocket + Push + Email
3. **Email Scheduler**: Independent 2-minute interval with varied content
4. **Monthly Newsletter**: With web scraping, new content detection, and AI personalization
5. **AI Recommendations**: Integration with external service with fallback

Each feature is independently configurable and can be enabled/disabled via properties.
