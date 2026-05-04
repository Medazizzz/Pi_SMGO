package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {

    private String watchPartyId;
    private String senderId;
    private String senderName;
    private String content;
    private String type; // CHAT, JOIN, LEAVE, REACTION, GIF, VOICE
    private LocalDateTime timestamp;
}