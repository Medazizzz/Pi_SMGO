package com.example.contentmanagement.service;

import com.example.contentmanagement.entity.Content;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Newsletter Service
 * WHY: Handles monthly newsletter campaigns
 * Users can trigger newsletters, system sends personalized content recommendations
 * Integrates with AI recommendation service for personalized content
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final RecommendationService recommendationService;

    @Value("${app.newsletter.enabled:true}")
    private boolean newsletterEnabled;

    @Value("${app.newsletter.from:newsletter@smgo.local}")
    private String fromEmail;

    @Value("${app.newsletter.subject-prefix:SMGO Monthly Newsletter - }")
    private String subjectPrefix;

    /**
     * Send monthly newsletter to all users
     * Can be triggered manually or by schedule
     */
    public void sendMonthlyNewsletter() {
        if (!newsletterEnabled) {
            log.info("Newsletter service is disabled");
            return;
        }

        try {
            log.info("Starting monthly newsletter campaign at {}", LocalDateTime.now());

            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                log.warn("No users found for newsletter");
                return;
            }

            // Get featured content for newsletter
            List<Content> featuredContent = getFeaturedContent();
            String newsletterContent = buildNewsletterContent(featuredContent);

            int sentCount = 0;
            for (User user : allUsers) {
                if (isDeliverableEmail(user.getEmail())) {
                    try {
                        String personalizedContent = personalizeNewsletterForUser(user, newsletterContent, featuredContent);
                        sendNewsletterEmail(user, personalizedContent);
                        sentCount++;
                        // Small delay to avoid overwhelming mail server
                        Thread.sleep(500);
                    } catch (Exception e) {
                        log.error("Failed to send newsletter to {}: {}", user.getEmail(), e.getMessage());
                    }
                }
            }

            log.info("Monthly newsletter completed: {} emails sent to {} users", sentCount, allUsers.size());

        } catch (Exception e) {
            log.error("Error sending monthly newsletter: {}", e.getMessage(), e);
        }
    }

    /**
     * Send newsletter to specific user (user-triggered)
     */
    public void sendNewsletterToUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (!isDeliverableEmail(user.getEmail())) {
            throw new RuntimeException("User has no deliverable email address");
        }

        try {
            List<Content> featuredContent = getFeaturedContent();
            String newsletterContent = buildNewsletterContent(featuredContent);
            String personalizedContent = personalizeNewsletterForUser(user, newsletterContent, featuredContent);

            sendNewsletterEmail(user, personalizedContent);
            log.info("User-triggered newsletter sent to {}", user.getEmail());

        } catch (Exception e) {
            log.error("Failed to send user-triggered newsletter to {}: {}", user.getEmail(), e.getMessage());
            throw new RuntimeException("Failed to send newsletter: " + e.getMessage());
        }
    }

    /**
     * Scheduled monthly newsletter (runs on the 1st of each month)
     */
    @Scheduled(cron = "${app.newsletter.cron:0 0 9 1 * *}")
    public void scheduledMonthlyNewsletter() {
        log.info("Scheduled monthly newsletter triggered");
        sendMonthlyNewsletter();
    }

    /**
     * Get featured content for newsletter
     */
    private List<Content> getFeaturedContent() {
        // Get top 10 content by rating/popularity
        return contentRepository.findAll().stream()
                .sorted((a, b) -> {
                    // Sort by rating descending, then by view count
                    double ratingA = a.getRating() != null ? a.getRating() : 0.0;
                    double ratingB = b.getRating() != null ? b.getRating() : 0.0;
                    int ratingCompare = Double.compare(ratingB, ratingA);
                    if (ratingCompare != 0) return ratingCompare;

                    int viewsA = a.getViewCount() != null ? a.getViewCount() : 0;
                    int viewsB = b.getViewCount() != null ? b.getViewCount() : 0;
                    return Integer.compare(viewsB, viewsA);
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Build base newsletter content with newly added content information via web scraping
     */
    private String buildNewsletterContent(List<Content> featuredContent) {
        StringBuilder content = new StringBuilder();
        content.append("Dear Subscriber,\n\n");
        content.append("Welcome to your monthly SMGO newsletter! Here's what's new this month:\n\n");

        // Add newly added content (last 30 days)
        List<Content> newContent = getRecentlyAddedContent();
        if (!newContent.isEmpty()) {
            content.append("=== NEW CONTENT THIS MONTH ===\n\n");
            for (int i = 0; i < Math.min(5, newContent.size()); i++) {
                Content item = newContent.get(i);
                content.append(String.format("%d. %s (%s)\n   Added: %s\n\n",
                        i + 1,
                        item.getTitle(),
                        item.getCategory() != null ? item.getCategory().getDisplayName() : "Content",
                        item.getPublishedAt() != null ? item.getPublishedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Recently"));
            }
            content.append("\n");
        }

        // Add featured content section
        content.append("=== FEATURED CONTENT ===\n\n");
        for (int i = 0; i < Math.min(5, featuredContent.size()); i++) {
            Content item = featuredContent.get(i);
            content.append(String.format("%d. %s (%s)\n",
                    i + 1,
                    item.getTitle(),
                    item.getCategory() != null ? item.getCategory().getDisplayName() : "Content"));
        }

        content.append("\nVisit SMGO to discover more personalized recommendations!\n\n");
        content.append("Best regards,\n");
        content.append("The SMGO Team\n");

        return content.toString();
    }

    /**
     * Get recently added content (last 30 days)
     */
    private List<Content> getRecentlyAddedContent() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return contentRepository.findAll().stream()
                .filter(content -> content.getPublishedAt() != null && content.getPublishedAt().isAfter(thirtyDaysAgo))
                .sorted((a, b) -> {
                    LocalDateTime dateA = a.getPublishedAt() != null ? a.getPublishedAt() : LocalDateTime.MIN;
                    LocalDateTime dateB = b.getPublishedAt() != null ? b.getPublishedAt() : LocalDateTime.MIN;
                    return dateB.compareTo(dateA); // Most recent first
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * Fetch external content metadata via web scraping (if URL is available)
     * WHY: Enriches newsletter with real-time external content information
     */
    private String fetchExternalContentMetadata(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }

        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(5000)
                    .get();

            // Extract metadata
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

    /**
     * Get trend data by web scraping popular content sources (example implementation)
     */
    private List<String> getTrendingContent() {
        List<String> trends = new ArrayList<>();
        try {
            // Example: Scrape trending content info (customize URL based on your sources)
            // This is a template - modify URLs based on your actual content sources
            Document doc = Jsoup.connect("https://example.com/trending")
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(5000)
                    .get();

            Elements trendItems = doc.select(".trending-item");
            for (int i = 0; i < Math.min(3, trendItems.size()); i++) {
                Element item = trendItems.get(i);
                String title = item.selectFirst("h3") != null ? item.selectFirst("h3").text() : "";
                if (!title.isBlank()) {
                    trends.add(title);
                }
            }
        } catch (Exception e) {
            log.debug("Failed to fetch trending content: {}", e.getMessage());
        }
        return trends;
    }

    /**
     * Personalize newsletter content for specific user using AI recommendations
     */
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

        // Add featured content
        personalized.append("Featured this month:\n\n");
        for (int i = 0; i < Math.min(3, featuredContent.size()); i++) {
            Content item = featuredContent.get(i);
            personalized.append(String.format("%d. %s\n",
                    i + 1, item.getTitle()));
        }

        personalized.append("\nVisit SMGO to explore more content tailored just for you!\n\n");
        personalized.append("Best regards,\n");
        personalized.append("The SMGO Team\n");

        return personalized.toString();
    }

    /**
     * Send newsletter email
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
        return email != null && !email.isBlank() && !email.endsWith("@system.local");
    }
}