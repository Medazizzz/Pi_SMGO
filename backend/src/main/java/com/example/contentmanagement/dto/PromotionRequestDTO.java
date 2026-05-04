package com.example.contentmanagement.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Date;

@Data
public class PromotionRequestDTO {
    @NotBlank(message = "Promotion code is required")
    @Size(min = 3, max = 20, message = "Code must be between 3 and 20 characters")
    private String code;

    @Min(value = 1, message = "Discount must be at least 1")
    @Max(value = 100, message = "Discount cannot exceed 100")
    private double pourcentageReduction;

    @Future(message = "Expiration date must be in the future")
    @NotNull(message = "Expiration date is required")
    private Date dateExpiration;

    private String clientId;
}
