package com.example.contentmanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class ReservationPaymentCheckoutRequestDTO {

    @NotNull(message = "reservation is required")
    @Valid
    private ReservationRequestDTO reservation;

    private String successUrl;
    private String cancelUrl;
}
