# CLUTCHING FEATURES
## Comprehensive Technical Guide for SMGO Advanced Features

### Overview
This guide covers the complete implementation of advanced features in the SMGO content management system, including AI recommendations with XGBoost, advanced analytics, notifications, Firebase integration, schedulers, and newsletters with web scraping.

## Table of Contents
1. [AI Recommendation System with XGBoost](#1-ai-recommendation-system-with-xgboost)
2. [Advanced Analytics & Top 5 Content](#2-advanced-analytics--top-5-content)
3. [Real-time Notifications System](#3-real-time-notifications-system)
4. [Firebase Cloud Messaging Integration](#4-firebase-cloud-messaging-integration)
5. [Email Fallback System](#5-email-fallback-system)
6. [Scheduler System](#6-scheduler-system)
7. [Newsletter with Web Scraping](#7-newsletter-with-web-scraping)
8. [System Architecture & Integration](#8-system-architecture--integration)
9. [Technical Terms Glossary](#9-technical-terms-glossary)
10. [Deployment & Testing](#10-deployment--testing)

---

## 1. AI Recommendation System with XGBoost

### Overview
The AI recommendation system uses XGBoost (Extreme Gradient Boosting) to provide personalized content recommendations based on user preferences and content features.

### Key Components
- **XGBoost Model**: Trained on user interaction data
- **Flask API**: Serves predictions via HTTP endpoints
- **Feature Engineering**: User preferences, content metadata, engagement scores
- **Real-time Inference**: Fast prediction serving

### STEP 1: Data Preparation
**File:** `ai-service/data/raw_recommendation_dataset.csv`

```python
import pandas as pd
import numpy as np

# Load and preprocess data
df = pd.read_csv('raw_recommendation_dataset.csv')

# Feature engineering
df['user_content_interaction'] = df['view_count'] * 0.7 + df['comment_count'] * 3.0
df['content_popularity'] = df['total_views'] / df['days_since_release']
df['user_preference_score'] = df['category_match'] * df['genre_match']

# One-hot encoding for categorical features
df_encoded = pd.get_dummies(df, columns=['category', 'genre', 'user_age_group'])
```

### STEP 2: XGBoost Model Training
**File:** `ai-service/train_model.py`

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib

# Prepare features and target
features = ['user_content_interaction', 'content_popularity', 'user_preference_score']
X = df_encoded[features + one_hot_columns]
y = df_encoded['recommendation_score']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# XGBoost parameters
params = {
    'objective': 'reg:linear',
    'max_depth': 6,
    'learning_rate': 0.1,
    'n_estimators': 100
}

# Train model
model = xgb.XGBRegressor(**params)
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)
mse = mean_squared_error(y_test, predictions)
print(f'MSE: {mse}')

# Save model
joblib.dump(model, 'model/content_recommender.joblib')
```

### STEP 3: Flask API Service
**File:** `ai-service/app.py`

```python
from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)
model = joblib.load('model/content_recommender.joblib')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_prefs = data['preferences']

    # Prepare features for prediction
    features = prepare_features(user_prefs)

    # Get predictions
    scores = model.predict(features)

    # Return top recommendations
    recommendations = get_top_recommendations(scores, data['content_ids'])

    return jsonify(recommendations)

def prepare_features(user_prefs):
    # Transform user preferences into model features
    features = pd.DataFrame([user_prefs])
    return features

def get_top_recommendations(scores, content_ids):
    # Sort by prediction score and return top N
    sorted_indices = np.argsort(scores)[::-1]
    top_content_ids = [content_ids[i] for i in sorted_indices[:10]]
    return top_content_ids

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5055)
```

### STEP 4: Spring Boot Integration
**File:** `backend/src/main/java/com/example/contentmanagement/service/AiRecommendationService.java`

```java
@Service
public class AiRecommendationService {

    @Value("${ai.service.url:http://localhost:5055}")
    private String aiServiceUrl;

    @Autowired
    private RestTemplate restTemplate;

    public List<String> getRecommendationsForUser(String userId) {
        try {
            // Get user preferences
            UserPreferences prefs = getUserPreferences(userId);

            // Get available content
            List<String> contentIds = contentRepository.findAllContentIds();

            // Call AI service
            Map<String, Object> request = Map.of(
                "preferences", prefs,
                "content_ids", contentIds
            );

            ResponseEntity<List<String>> response = restTemplate.postForEntity(
                aiServiceUrl + "/recommend",
                request,
                new ParameterizedTypeReference<List<String>>() {}
            );

            return response.getBody();

        } catch (Exception e) {
            // Fallback to basic recommendations
            return getFallbackRecommendations(userId);
        }
    }
}
```

---

## 2. Advanced Analytics & Top 5 Content

### Overview
Advanced analytics calculate engagement scores and provide top 5 content recommendations.

### STEP 1: Engagement Score Calculation
**File:** `backend/src/main/java/com/example/contentmanagement/service/ContentAnalyticsService.java`

```java
@Service
public class ContentAnalyticsService {

    @Autowired
    private ContentRepository contentRepository;

    public List<Content> getTop5Contents() {
        return contentRepository.findAll().stream()
            .map(this::calculateEngagementScore)
            .sorted((a, b) -> Double.compare(b.getEngagementScore(), a.getEngagementScore()))
            .limit(5)
            .collect(Collectors.toList());
    }

    private Content calculateEngagementScore(Content content) {
        double score = content.getViewCount() * 0.7 +
                      content.getCommentsCount() * 3.0 +
                      content.getSharesCount() * 5.0 +
                      (content.getRating() - 3.0) * 2.0;

        // Time decay factor (newer content gets boost)
        long daysSinceRelease = ChronoUnit.DAYS.between(content.getReleaseDate(), LocalDate.now());
        double timeFactor = Math.max(0.1, 1.0 - (daysSinceRelease / 365.0));

        content.setEngagementScore(score * timeFactor);
        return content;
    }
}
```

### STEP 2: REST API Endpoint
**File:** `backend/src/main/java/com/example/contentmanagement/controller/ContentController.java`

```java
@RestController
@RequestMapping("/api/contents")
public class ContentController {

    @Autowired
    private ContentAnalyticsService analyticsService;

    @GetMapping("/top5")
    public ResponseEntity<List<Content>> getTop5Contents() {
        List<Content> topContents = analyticsService.getTop5Contents();
        return ResponseEntity.ok(topContents);
    }
}
```

### STEP 3: Angular Frontend Integration
**File:** `frontend/src/app/components/unified-home/unified-home.component.ts`

```typescript
export class UnifiedHomeComponent implements OnInit {
  topContents: Content[] = [];
  loading = false;

  constructor(private contentService: ContentService) {}

  ngOnInit() {
    this.loadTopContents();
  }

  private loadTopContents() {
    this.loading = true;
    this.contentService.getTop5Contents().subscribe({
      next: (contents) => {
        this.topContents = contents;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load top contents:', error);
        this.loading = false;
      }
    });
  }
}
```

---

## 3. Real-time Notifications System

### Overview
WebSocket-based real-time notification system using STOMP protocol.

### STEP 1: WebSocket Configuration
**File:** `backend/src/main/java/com/example/contentmanagement/config/WebSocketConfig.java`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

### STEP 2: Notification Service
**File:** `backend/src/main/java/com/example/contentmanagement/service/NotificationService.java`

```java
@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    public void broadcastNotification(Notification notification) {
        // Save to database
        notificationRepository.save(notification);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications", notification);

        // Also send via other channels
        sendViaFirebase(notification);
        scheduleEmailFallback(notification);
    }

    private void scheduleEmailFallback(Notification notification) {
        notification.setEmailFallbackDueAt(
            LocalDateTime.now().plusSeconds(20)
        );
        notificationRepository.save(notification);
    }
}
```

### STEP 3: Angular WebSocket Client
**File:** `frontend/src/app/services/notification.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient: any;
  private notificationSubject = new Subject<Notification>();

  constructor() {
    this.connect();
  }

  private connect() {
    const socket = new SockJS('/ws/notifications');
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, () => {
      this.stompClient.subscribe('/topic/notifications', (message: any) => {
        const notification = JSON.parse(message.body);
        this.notificationSubject.next(notification);
      });
    });
  }

  getNotifications() {
    return this.notificationSubject.asObservable();
  }
}
```

---

## 4. Firebase Cloud Messaging Integration

### Overview
Push notifications to mobile devices using Firebase Cloud Messaging.

### STEP 1: Firebase Configuration
**File:** `backend/src/main/java/com/example/contentmanagement/config/FirebaseConfig.java`

```java
@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseMessaging firebaseMessaging() throws IOException {
        GoogleCredentials credentials = GoogleCredentials
            .fromStream(new ClassPathResource("firebase-service-account.json").getInputStream());

        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }

        return FirebaseMessaging.getInstance();
    }
}
```

### STEP 2: Firebase Notification Service
**File:** `backend/src/main/java/com/example/contentmanagement/service/FirebaseNotificationService.java`

```java
@Service
public class FirebaseNotificationService {

    @Autowired
    private FirebaseMessaging firebaseMessaging;

    public void sendPushNotification(String token, String title, String body) {
        try {
            Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .build();

            String response = firebaseMessaging.send(message);
            System.out.println("Firebase message sent: " + response);

        } catch (FirebaseMessagingException e) {
            System.err.println("Firebase send failed: " + e.getMessage());
        }
    }

    public void sendMulticastNotification(List<String> tokens, String title, String body) {
        try {
            MulticastMessage message = MulticastMessage.builder()
                .setNotification(com.google.firebase.messaging.Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .addAllTokens(tokens)
                .build();

            BatchResponse response = firebaseMessaging.sendMulticast(message);
            System.out.println("Firebase multicast sent: " + response.getSuccessCount() + " success");

        } catch (FirebaseMessagingException e) {
            System.err.println("Firebase multicast failed: " + e.getMessage());
        }
    }
}
```

### STEP 3: User Token Management
**File:** `backend/src/main/java/com/example/contentmanagement/service/UserService.java`

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public void registerDeviceToken(String userId, String deviceToken) {
        User user = userRepository.findById(userId).orElseThrow();
        user.getDeviceTokens().add(deviceToken);
        userRepository.save(user);
    }

    public List<String> getDeviceTokens(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return user.getDeviceTokens();
    }
}
```

---

## 5. Email Fallback System

### Overview
Email notifications sent when users don't see real-time notifications.

### STEP 1: Email Configuration
**File:** `backend/src/main/resources/application.properties`

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### STEP 2: Email Service
**File:** `backend/src/main/java/com/example/contentmanagement/service/EmailService.java`

```java
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);

        } catch (MailException e) {
            System.err.println("Email send failed: " + e.getMessage());
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = html

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("HTML email send failed: " + e.getMessage());
        }
    }
}
```

### STEP 3: Email Fallback Scheduler
**File:** `backend/src/main/java/com/example/contentmanagement/service/NotificationServiceImpl.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Value("${app.notifications.email-fallback-delay-seconds:20}")
    private long emailFallbackDelaySeconds;

    @Value("${app.notifications.email-fallback-enabled:true}")
    private boolean emailFallbackEnabled;

    @Scheduled(fixedRate = 10000)  // Every 10 seconds
    @Transactional
    public void sendEmailRemindersForUnreadNotifications() {
        if (!emailFallbackEnabled) {
            return;
        }

        try {
            LocalDateTime now = LocalDateTime.now();

            // Find notifications due for email reminder
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
                } catch (Exception e) {
                    log.error("Failed to send email reminder: {}", e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error in email fallback scheduler: {}", e.getMessage());
        }
    }

    private void sendEmailReminder(Notification notification) {
        String userEmail = getUserEmail(notification.getUserId());
        String subject = "SMGO Notification: " + notification.getTitle();
        String content = buildEmailContent(notification);

        emailService.sendEmail(userEmail, subject, content);
    }
}
```

---

## 6. Scheduler System

### Overview
Automated background tasks using Spring @Scheduled annotations.

### Scheduler Types
| Type | Annotation | Use Case |
|------|------------|----------|
| Fixed Rate | @Scheduled(fixedRate = 10000) | Email reminders every 10 seconds |
| Fixed Delay | @Scheduled(fixedDelay = 30000) | Newsletter processing with delay |
| Cron Expression | @Scheduled(cron = "0 0 9 1 * *") | Monthly newsletter on 1st at 9 AM |

### STEP 1: Scheduler Configuration
**File:** `backend/src/main/java/com/example/contentmanagement/config/SchedulingConfig.java`

```java
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Enables @Scheduled annotations across the application
}
```

### STEP 2: Email Reminder Scheduler
**File:** `backend/src/main/java/com/example/contentmanagement/service/NotificationServiceImpl.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Scheduled(fixedRate = 10000)  // Every 10 seconds
    @Transactional
    public void sendEmailRemindersForUnreadNotifications() {
        // Implementation as shown above
    }
}
```

### STEP 3: Newsletter Scheduler
**File:** `backend/src/main/java/com/example/contentmanagement/service/NewsletterService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    @Value("${app.newsletter.enabled:true}")
    private boolean newsletterEnabled;

    @Scheduled(cron = "${app.newsletter.cron:0 0 9 1 * *}")
    public void scheduledMonthlyNewsletter() {
        log.info("Scheduled monthly newsletter triggered");
        sendMonthlyNewsletter();
    }

    @Scheduled(fixedDelayString = "${app.newsletters.scheduler-check-interval-ms:30000}")
    @Transactional
    public void processDueCampaigns() {
        log.info("Newsletter scheduler triggered at {}", LocalDateTime.now());
        int dispatched = dispatchDueCampaigns();
        log.info("Newsletter scheduler completed: {} campaign(s) dispatched", dispatched);
    }
}
```

---

## 7. Newsletter with Web Scraping

### Overview
Automated content newsletters with external data enrichment using Jsoup for web scraping.

### Web Scraping Components
| Component | Purpose | Library |
|-----------|---------|---------|
| Content Metadata | Extract descriptions from content URLs | Jsoup |
| Trending Content | Scrape popular content from external sites | Jsoup |
| External Links | Fetch additional content information | HttpClient |

### STEP 1: Jsoup Web Scraping
**File:** `backend/src/main/java/com/example/contentmanagement/service/NewsletterService.java`

```java
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public String fetchExternalContentMetadata(String url) {
    if (url == null || url.isBlank()) {
        return "";
    }

    try {
        // Connect with user agent and timeout
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(5000)  // 5 second timeout
                .get();

        // Extract meta description
        Element descElement = doc.selectFirst("meta[name=description]");
        if (descElement != null) {
            return descElement.attr("content");
        }

        // Fallback: extract first paragraph
        Element paragraph = doc.selectFirst("p");
        if (paragraph != null) {
            return paragraph.text();
        }

        return "";
    } catch (Exception e) {
        log.debug("Failed to fetch metadata from {}: {}", url, e.getMessage());
        return "";
    }
}

private List<String> getTrendingContent() {
    List<String> trends = new ArrayList<>();
    try {
        // Example: Scrape from a content aggregation site
        Document doc = Jsoup.connect("https://example.com/trending")
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(5000)
                .get();

        // Extract trending items
        Elements trendItems = doc.select(".trending-item");
        for (int i = 0; i < Math.min(3, trendItems.size()); i++) {
            Element item = trendItems.get(i);
            String title = item.selectFirst("h3") != null ?
                item.selectFirst("h3").text() : "";
            if (!title.isBlank()) {
                trends.add(title);
            }
        }
    } catch (Exception e) {
        log.debug("Failed to fetch trending content: {}", e.getMessage());
    }
    return trends;
}
```

### STEP 2: Newsletter Campaign System
**File:** `backend/src/main/java/com/example/contentmanagement/service/impl/NewsletterCampaignServiceImpl.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterCampaignServiceImpl implements NewsletterCampaignService {

    @Override
    @Transactional
    public NewsletterCampaignDTO createCampaign(NewsletterCampaignDTO newsletterCampaignDTO, String createdBy) {
        NewsletterCampaign campaign = NewsletterCampaign.builder()
                .title(newsletterCampaignDTO.getTitle())
                .message(newsletterCampaignDTO.getMessage())
                .scheduledAt(newsletterCampaignDTO.getScheduledAt())
                .targetCategory(normalize(newsletterCampaignDTO.getTargetCategory()))
                .targetGenres(normalizeList(newsletterCampaignDTO.getTargetGenres()))
                .sendEmail(newsletterCampaignDTO.getSendEmail() != null ?
                    newsletterCampaignDTO.getSendEmail() : true)
                .status("SCHEDULED")
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .recipientCount(0)
                .build();

        NewsletterCampaign saved = newsletterCampaignRepository.save(campaign);

        // If scheduled time is in the past, dispatch immediately
        if (!saved.getScheduledAt().isAfter(LocalDateTime.now())) {
            return dispatchCampaign(saved.getId());
        }

        return mapToDTO(saved);
    }

    @Scheduled(fixedDelayString = "${app.newsletters.scheduler-check-interval-ms:30000}")
    @Transactional
    public void processDueCampaigns() {
        log.info("Newsletter scheduler triggered at {}", LocalDateTime.now());
        int dispatched = dispatchDueCampaigns();
        log.info("Newsletter scheduler completed: {} campaign(s) dispatched", dispatched);
    }
}
```

### STEP 3: Personalized Newsletter Content
```java
private String personalizeNewsletterForUser(User user, String baseContent, List<Content> featuredContent) {
    StringBuilder personalized = new StringBuilder();

    // Add personalized greeting
    String greeting = user.getFirstName() != null && !user.getFirstName().isEmpty()
            ? "Dear " + user.getFirstName() + ",\n\n"
            : "Dear Subscriber,\n\n";
    personalized.append(greeting);

    // Try to get AI recommendations for this user
    try {
        List<String> recommendations = recommendationService.getRecommendationsForUser(user.getId());
        if (recommendations != null && !recommendations.isEmpty()) {
            personalized.append("Based on your viewing history, here are some personalized recommendations:\n\n");

            // Get content details for recommendations
            List<Content> recommendedContent = contentRepository.findAllById(recommendations).stream()
                    .limit(3)
                    .collect(Collectors.toList());

            for (int i = 0; i < recommendedContent.size(); i++) {
                Content item = recommendedContent.get(i);
                personalized.append(String.format("• %s (%s)\n",
                        item.getTitle(),
                        item.getCategory() != null ? item.getCategory().getDisplayName() : "Content"));
            }
            personalized.append("\n");
        }
    } catch (Exception e) {
        log.warn("Failed to get AI recommendations for user {}: {}", user.getId(), e.getMessage());
    }

    // Add base newsletter content
    personalized.append(baseContent);

    return personalized.toString();
}
```

---

## 8. System Architecture & Integration

### Complete System Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                    SMGO CONTENT MANAGEMENT SYSTEM                 │
├─────────────────────────────────────────────────────────────────┤
│  ANGULAR FRONTEND (Port 4200)                                   │
│  ├─ Unified Home Component (Top 5 Content Display)              │
│  ├─ AI Discovery Component (Recommendation Q&A)                 │
│  ├─ Admin Notifications (Broadcast Interface)                   │
│  └─ WebSocket Client (Real-time Notifications)                  │
├─────────────────────────────────────────────────────────────────┤
│  SPRING BOOT BACKEND (Port 8090)                                │
│  ├─ Content Management (Top 5 Analytics)                        │
│  ├─ Notification System (Multi-channel delivery)               │
│  ├─ Newsletter Campaigns (Scheduled & Web Scraping)             │
│  ├─ Recommendation Service (AI Integration)                     │
│  ├─ WebSocket Server (Real-time messaging)                      │
│  └─ Email Service (Fallback notifications)                      │
├─────────────────────────────────────────────────────────────────┤
│  PYTHON AI SERVICE (Port 5055)                                  │
│  ├─ XGBoost Model (Content Recommendations)                     │
│  ├─ Flask API (HTTP Interface)                                  │
│  └─ Joblib Persistence (Model Storage)                          │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                               │
│  ├─ MongoDB (Data Storage)                                      │
│  ├─ Firebase Cloud Messaging (Push Notifications)               │
│  ├─ SMTP Server (Email Delivery)                                │
│  └─ External Websites (Web Scraping)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Example
1. User visits home page → Angular loads top 5 content via /api/contents/top5
2. Admin sends notification → Spring Boot creates notifications + WebSocket broadcast
3. User doesn't read notification → Scheduler sends email after 20 seconds
4. Monthly newsletter trigger → Web scraping enriches content + AI personalization
5. User answers Q&A → Angular calls Python AI service for recommendations

---

## 9. Technical Terms Glossary

| Term | Definition | Context in Our System |
|------|------------|----------------------|
| XGBoost | Extreme Gradient Boosting - ML algorithm for regression/classification | Used for content recommendation scoring |
| Flask | Lightweight Python web framework | Serves AI model predictions via HTTP API |
| WebSocket | Full-duplex communication protocol over TCP | Real-time notification delivery |
| STOMP | Simple Text Oriented Messaging Protocol | WebSocket subprotocol for messaging |
| Firebase FCM | Firebase Cloud Messaging for push notifications | Mobile device notification delivery |
| Jsoup | Java HTML parser library | Web scraping for newsletter content enrichment |
| Joblib | Python serialization library | Persistent storage of trained ML models |
| @Scheduled | Spring annotation for cron-like job scheduling | Automated email reminders and newsletters |
| MongoDB | NoSQL document database | Primary data storage for content and users |
| Angular Signals | Reactive state management in Angular | Real-time UI updates for recommendations |
| HttpClient | Java HTTP client library | REST API calls between services |
| One-Hot Encoding | Converting categorical variables to binary vectors | Preprocessing for XGBoost model |
| Pipeline | Scikit-learn class for chaining preprocessing and models | Complete ML workflow from data to prediction |
| MulticastMessage | Firebase message sent to multiple device tokens | Broadcast push notifications |
| @Transactional | Spring annotation ensuring database consistency | Atomic operations across multiple database calls |

---

## 10. Deployment & Testing

### Startup Sequence
1. Start MongoDB database
2. Start Python AI service: python ai-service/app.py
3. Start Spring Boot backend: mvn spring-boot:run (or java -jar)
4. Start Angular frontend: ng serve
5. Test services are running on ports 5055, 8090, 4200

### Testing Checklist
| Feature | Test Method | Expected Result |
|---------|-------------|-----------------|
| Top 5 Content | GET /api/contents/top5 | Returns 5 items with engagement scores |
| AI Recommendations | POST /ai-service/recommend | Returns personalized content list |
| Notifications | POST /api/admin/notifications/broadcast | WebSocket + Firebase + Email |
| Newsletter | Trigger scheduler or manual send | Personalized emails with web content |
| WebSocket | Connect to /ws/notifications | Real-time notification delivery |

### Conclusion
This comprehensive guide covers the complete implementation of advanced features in the SMGO content management system. Each feature is built with production-ready patterns, proper error handling, and scalable architecture. The system demonstrates integration of modern web technologies, machine learning, real-time messaging, and automated scheduling.

**Key achievements:**
• AI-powered content recommendations using XGBoost
• Real-time multi-channel notification system
• Automated newsletter campaigns with web scraping
• Advanced content analytics with engagement scoring
• Firebase push notifications for mobile devices
• Comprehensive scheduler system for background tasks</content>
<parameter name="filePath">c:\Users\azuz\Downloads\Pi_SMGO-content-notification\CLUTCHING_FEATURES.md