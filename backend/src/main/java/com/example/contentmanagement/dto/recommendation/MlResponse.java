package com.example.contentmanagement.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MlResponse {
    private String recommande;
    private Map<String, Double> probabilites;
}