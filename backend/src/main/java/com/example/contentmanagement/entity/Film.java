package com.example.contentmanagement.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.example.contentmanagement.validation.NoSpecialCharacters;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Film extends Content {
    static {
        // Register the Film subtype
    }
    @Positive(message = "Duration must be a positive number")
    private Integer durationInMinutes;
    
    @NotBlank(message = "Director is mandatory")
    @Size(min = 2, max = 100, message = "Director name must be between 2 and 100 characters")
    @NoSpecialCharacters(message = "Director name cannot contain special characters")
    private String director;
}
