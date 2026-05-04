package com.example.contentmanagement.dto;

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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsletterCampaignDTO {
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

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime dispatchedAt;

    private String createdBy;

    private Integer recipientCount;

    private String lastError;
}
