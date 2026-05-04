package com.example.contentmanagement.entity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Series extends Content {
    static {
        // Register the Series subtype
    }
    @NotNull(message = "Number of seasons is mandatory")
    @Positive(message = "Number of seasons must be a positive number")
    private Integer numberOfSeasons;
    
    @NotNull(message = "Number of episodes is mandatory")
    @Positive(message = "Number of episodes must be a positive number")
    private Integer numberOfEpisodes;
    
    private Boolean isCompleted = false;
}
