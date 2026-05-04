package com.example.contentmanagement.entity;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import lombok.*;
import java.time.LocalDateTime;

@Document(collection = "comments")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    @Id
    
    private String id;

    
    private String text;

    private LocalDateTime createdAt;

    @DBRef
    
    private Content content;

    @DBRef
    
    private User user;
}
