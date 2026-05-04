package com.example.contentmanagement.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "abonnements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Abonnement {

    @Id
    private String id;

    @NotNull(message = "Subscription type is required")
    private AbonnementType type;

    @Positive(message = "Price must be positive")
    private double prix;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must contain between 10 and 500 characters")
    private String description;
}
