package com.example.contentmanagement.entity;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "fidelities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fidelity {

    @Id
    private String id;

    @Min(value = 0, message = "Points must be non-negative")
    private int points;

    @NotNull(message = "Fidelity level is required")
    private FidelityLevel level;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 300, message = "Description must contain between 5 and 300 characters")
    private String description;
}
