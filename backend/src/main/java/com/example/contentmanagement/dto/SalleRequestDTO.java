package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
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
public class SalleRequestDTO {
    @NotBlank(message = "name is required")
    private String name;

    @Positive(message = "capacity must be positive")
    private int capacity;
}
