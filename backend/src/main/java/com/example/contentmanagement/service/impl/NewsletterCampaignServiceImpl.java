package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.NewsletterCampaignDTO;
import com.example.contentmanagement.entity.Content;
import com.example.contentmanagement.entity.Genre;
import com.example.contentmanagement.entity.NewsletterCampaign;
import com.example.contentmanagement.entity.Notification;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.ContentRepository;
import com.example.contentmanagement.repository.GenreRepository;
import com.example.contentmanagement.repository.NewsletterCampaignRepository;
import com.example.contentmanagement.repository.NotificationRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.NewsletterCampaignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterCampaignServiceImpl implements NewsletterCampaignService {

    private final NewsletterCampaignRepository newsletterCampaignRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ReservationRepository reservationRepository;
    private final ContentRepository contentRepository;
    private final GenreRepository genreRepository;
    private final JavaMailSender mailSender;
    private final MongoTemplate mongoTemplate;

    @Value("${app.notifications.email-from:no-reply@smgo.local}")
    private String fromEmail;

    @Override
    @Transactional
    public NewsletterCampaignDTO createCampaign(NewsletterCampaignDTO newsletterCampaignDTO, String createdBy) {
        NewsletterCampaign campaign = NewsletterCampaign.builder()
                .title(newsletterCampaignDTO.getTitle())
                .message(newsletterCampaignDTO.getMessage())
                .scheduledAt(newsletterCampaignDTO.getScheduledAt())
                .targetCategory(normalize(newsletterCampaignDTO.getTargetCategory()))
                .targetGenres(normalizeList(newsletterCampaignDTO.getTargetGenres()))
                .sendEmail(newsletterCampaignDTO.getSendEmail() == null || newsletterCampaignDTO.getSendEmail())
                .status("SCHEDULED")
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .recipientCount(0)
                .build();

        NewsletterCampaign saved = newsletterCampaignRepository.save(campaign);
        if (!saved.getScheduledAt().isAfter(LocalDateTime.now())) {
            return dispatchCampaign(saved.getId());
        }

        return mapToDTO(saved);
    }

    @Override
    public List<NewsletterCampaignDTO> getAllCampaigns() {
        return newsletterCampaignRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NewsletterCampaignDTO dispatchCampaign(String campaignId) {
        NewsletterCampaign campaign = claimCampaignForDispatch(campaignId)
                .orElseGet(() -> newsletterCampaignRepository.findById(campaignId)
                        .orElseThrow(() -> new IllegalArgumentException("Newsletter campaign not found: " + campaignId)));

        if (!"DISPATCHING".equalsIgnoreCase(campaign.getStatus())) {
            return mapToDTO(campaign);
        }

        LocalDateTime now = LocalDateTime.now();

        try {
            List<User> recipients = resolveRecipients(campaign);
            int delivered = 0;
            String subject = campaign.getTitle();

            for (User user : recipients) {
                try {
                    Notification notification = Notification.builder()
                            .title(campaign.getTitle())
                            .message(campaign.getMessage())
                            .type("INFO")
                            .createdAt(now)
                            .isRead(false)
                            .emailFallbackSent(true)
                            .emailFallbackSentAt(now)
                            .user(user)
                            .build();
                    notificationRepository.save(notification);
                    if (Boolean.TRUE.equals(campaign.getSendEmail())) {
                        sendEmail(user.getEmail(), subject, campaign.getMessage());
                    }
                    delivered++;
                } catch (Exception ex) {
                    log.error("Failed to deliver newsletter {} to {}: {}", campaign.getId(), user.getEmail(), ex.getMessage(), ex);
                }
            }

            campaign.setStatus("DISPATCHED");
            campaign.setDispatchedAt(now);
            campaign.setRecipientCount(delivered);
            campaign.setLastError(delivered == 0 ? "No recipients matched the audience filter" : null);
            newsletterCampaignRepository.save(campaign);
            return mapToDTO(campaign);
        } catch (Exception ex) {
            log.error("Failed to dispatch newsletter campaign {}: {}", campaignId, ex.getMessage(), ex);
            campaign.setStatus("SCHEDULED");
            campaign.setLastError(ex.getMessage());
            newsletterCampaignRepository.save(campaign);
            throw ex;
        }
    }

    @Scheduled(fixedDelayString = "${app.newsletters.scheduler-check-interval-ms:30000}")
    @Transactional
    public void processDueCampaigns() {
        log.info("Newsletter scheduler triggered at {}", LocalDateTime.now());
        int dispatched = dispatchDueCampaigns();
        log.info("Newsletter scheduler completed: {} campaign(s) dispatched", dispatched);
    }

    @Override
    @Transactional
    public int dispatchDueCampaigns() {
        List<NewsletterCampaign> dueCampaigns = newsletterCampaignRepository.findByStatusAndScheduledAtLessThanEqual("SCHEDULED", LocalDateTime.now());
        int dispatched = 0;
        for (NewsletterCampaign campaign : dueCampaigns) {
            if (!campaign.getScheduledAt().isAfter(LocalDateTime.now())) {
                try {
                    dispatchCampaign(campaign.getId());
                    dispatched++;
                } catch (Exception ex) {
                    log.error("Failed to dispatch due newsletter campaign {}: {}", campaign.getId(), ex.getMessage(), ex);
                }
            }
        }
        return dispatched;
    }

    private java.util.Optional<NewsletterCampaign> claimCampaignForDispatch(String campaignId) {
        Query query = new Query();
        query.addCriteria(Criteria.where("_id").is(campaignId).and("status").is("SCHEDULED"));

        Update update = new Update().set("status", "DISPATCHING");

        return java.util.Optional.ofNullable(mongoTemplate.findAndModify(query, update, NewsletterCampaign.class));
    }

    private List<User> resolveRecipients(NewsletterCampaign campaign) {
        List<User> allActiveUsers = userRepository.findAll().stream()
                .filter(user -> user.isEnabled() && "ACTIVE".equalsIgnoreCase(user.getStatus()))
                .collect(Collectors.toList());

        boolean noAudienceFilters = (campaign.getTargetCategory() == null || campaign.getTargetCategory().isBlank())
                && (campaign.getTargetGenres() == null || campaign.getTargetGenres().isEmpty());
        if (noAudienceFilters) {
            return allActiveUsers;
        }

        Map<String, Content> contentById = contentRepository.findAll().stream()
                .collect(Collectors.toMap(Content::getId, content -> content, (left, right) -> left));
        Map<String, String> genreNameById = genreRepository.findAll().stream()
                .collect(Collectors.toMap(Genre::getId, genre -> genre.getName().toLowerCase(Locale.ROOT), (left, right) -> left));
        Set<String> targetGenres = normalizeList(campaign.getTargetGenres()).stream()
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        String targetCategory = normalize(campaign.getTargetCategory());

        Set<String> userIds = new LinkedHashSet<>();
        reservationRepository.findAll().forEach(reservation -> {
            Content content = contentById.get(reservation.getContenuId());
            if (content == null || reservation.getUserId() == null) {
                return;
            }

            boolean categoryMatches = targetCategory != null
                    && content.getCategory() != null
                    && content.getCategory().name().equalsIgnoreCase(targetCategory);

            boolean genreMatches = false;
            if (!targetGenres.isEmpty() && content.getGenreIds() != null) {
                for (String genreId : content.getGenreIds()) {
                    String genreName = genreNameById.get(genreId);
                    if (genreName != null && targetGenres.contains(genreName)) {
                        genreMatches = true;
                        break;
                    }
                }
            }

            if (categoryMatches || genreMatches) {
                userIds.add(reservation.getUserId());
            }
        });

        if (userIds.isEmpty()) {
            return List.of();
        }

        return userRepository.findAllById(userIds).stream()
                .filter(user -> user.isEnabled() && "ACTIVE".equalsIgnoreCase(user.getStatus()))
                .collect(Collectors.toList());
    }

    private void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, "SMGO admin");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send email to " + to, ex);
        }
    }

    private NewsletterCampaignDTO mapToDTO(NewsletterCampaign campaign) {
        return NewsletterCampaignDTO.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .message(campaign.getMessage())
                .scheduledAt(campaign.getScheduledAt())
                .targetCategory(campaign.getTargetCategory())
                .targetGenres(campaign.getTargetGenres() != null ? new ArrayList<>(campaign.getTargetGenres()) : new ArrayList<>())
                .sendEmail(campaign.getSendEmail())
                .status(campaign.getStatus())
                .createdAt(campaign.getCreatedAt())
                .dispatchedAt(campaign.getDispatchedAt())
                .createdBy(campaign.getCreatedBy())
                .recipientCount(campaign.getRecipientCount())
                .lastError(campaign.getLastError())
                .build();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim())
                .distinct()
                .collect(Collectors.toList());
    }
}
