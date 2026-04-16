package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessageDTO {

    private String watchPartyId;
    private String senderId;
    private String receiverId;
    private String type; // OFFER, ANSWER, ICE_CANDIDATE, JOIN, LEAVE, READY
    private Object data;
}