package com.example.contentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistJoinResponseDTO {
    private String waitlistEntryId;
    private String seanceId;
    private String email;
    private int position;
    private String message;
}
