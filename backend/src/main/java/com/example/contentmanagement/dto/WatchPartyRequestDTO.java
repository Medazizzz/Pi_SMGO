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
public class WatchPartyRequestDTO {
    @NotBlank(message = "Title is required")
    private String titre;

    @NotBlank(message = "contenuId is required")
    private String contenuId;
}
