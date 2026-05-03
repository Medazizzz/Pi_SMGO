package com.example.contentmanagement.service.fidelity;

import org.springframework.stereotype.Service;

@Service
public class LoyaltyLevelService {

    public String getLevel(double score) {

        if (score < 100) return "BRONZE";
        if (score < 300) return "SILVER";
        if (score < 600) return "GOLD";
        return "VIP";
    }
}