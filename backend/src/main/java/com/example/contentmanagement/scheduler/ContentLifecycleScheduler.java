package com.example.contentmanagement.scheduler;

import com.example.contentmanagement.entity.Content;
import com.example.contentmanagement.entity.ContentStatus;
import com.example.contentmanagement.repository.ContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.content.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class ContentLifecycleScheduler {

    private final ContentRepository contentRepository;

    @Scheduled(cron = "${app.content.scheduler.cron:0 * * * * *}")
    public void processContentLifecycle() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Content lifecycle scheduler triggered at {}", now);

        List<Content> toPublish = contentRepository.findByStatusAndPublishAtLessThanEqual(ContentStatus.SCHEDULED, now);
        List<Content> toArchive = contentRepository.findByStatusAndExpireAtLessThanEqual(ContentStatus.PUBLISHED, now);

        int publishedCount = 0;
        int archivedCount = 0;

        if (!toPublish.isEmpty()) {
            List<Content> updates = new ArrayList<>();
            for (Content content : toPublish) {
                content.setStatus(ContentStatus.PUBLISHED);
                content.setVisible(Boolean.TRUE);
                if (content.getPublishedAt() == null) {
                    content.setPublishedAt(now);
                }
                updates.add(content);
                publishedCount++;
            }
            contentRepository.saveAll(updates);
        }

        if (!toArchive.isEmpty()) {
            List<Content> updates = new ArrayList<>();
            for (Content content : toArchive) {
                content.setStatus(ContentStatus.ARCHIVED);
                content.setVisible(Boolean.FALSE);
                updates.add(content);
                archivedCount++;
            }
            contentRepository.saveAll(updates);
        }

        if (publishedCount > 0 || archivedCount > 0) {
            log.info("Content lifecycle scheduler executed. Published: {}, Archived: {}", publishedCount, archivedCount);
        }
    }
}