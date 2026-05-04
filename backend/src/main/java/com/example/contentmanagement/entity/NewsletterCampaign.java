package com.example.contentmanagement.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "newsletter_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsletterCampaign {
    @Id
    private String id;

    @NotBlank(message = "Title is mandatory")
    private String title;

    @NotBlank(message = "Message is mandatory")
    private String message;

    @NotNull(message = "Scheduled date is mandatory")
    private LocalDateTime scheduledAt;

    private String targetCategory;

    @Builder.Default
    private List<String> targetGenres = new ArrayList<>();

    @Builder.Default
    private Boolean sendEmail = true;

    @Builder.Default
    private String status = "SCHEDULED";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime dispatchedAt;

    private String createdBy;

    @Builder.Default
    private Integer recipientCount = 0;

    private String lastError;
}
