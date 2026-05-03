package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
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
public class WaitlistJoinRequestDTO {

    @NotBlank(message = "seanceId is required")
    private String seanceId;

    private String userId;
    private String email;
}
