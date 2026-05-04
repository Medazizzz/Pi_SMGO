package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.SignalMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WatchPartySignalController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/watchparty.signal")
    public void signal(@Payload SignalMessageDTO message) {
        if (message == null) {
            return;
        }

        if (message.getWatchPartyId() == null || message.getWatchPartyId().isBlank()) {
            return;
        }

        messagingTemplate.convertAndSend(
                "/topic/watchparty/" + message.getWatchPartyId() + "/signal",
                message
        );
    }
}