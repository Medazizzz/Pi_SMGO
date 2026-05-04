package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeriesDTO extends ContentDTO {
    @NotNull(message = "Number of seasons is mandatory")
    @Positive(message = "Number of seasons must be positive")
    private Integer numberOfSeasons;

    @NotNull(message = "Number of episodes is mandatory")
    @Positive(message = "Number of episodes must be positive")
    private Integer numberOfEpisodes;

    private Boolean isCompleted;
}
