package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private String id;

    @NotBlank(message = "Message is mandatory")
    private String message;

    private String title;

    @NotBlank(message = "Type is mandatory")
    @Pattern(regexp = "INFO|SUCCESS|WARNING|ERROR", message = "Type must be INFO, SUCCESS, WARNING, or ERROR")
    private String type;

    private LocalDateTime createdAt;

    @Builder.Default
    private Boolean isRead = false;

    private String userId;

    private String username;
}
