package com.example.contentmanagement.dto;

import lombok.Data;

import java.util.Date;

@Data
public class PromotionResponseDTO {
    private String id;
    private String code;
    private double pourcentageReduction;
    private Date dateExpiration;
    private String clientId;
    private boolean active;
}
