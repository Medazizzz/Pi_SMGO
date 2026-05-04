package com.example.contentmanagement.entity;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
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

    @DBRef
    @NotNull(message = "User is mandatory")
    private User user;
}
