package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class WatchPartyChatRoomController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/watchparty.chat")
    public void sendToRoom(@Payload ChatMessageDTO message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }

        if (message.getType() == null || message.getType().isBlank()) {
            message.setType("CHAT");
        }

        if (message.getWatchPartyId() == null || message.getWatchPartyId().isBlank()) {
            return;
        }

        messagingTemplate.convertAndSend(
                "/topic/watchparty/" + message.getWatchPartyId() + "/chat",
                message
        );
    }
}