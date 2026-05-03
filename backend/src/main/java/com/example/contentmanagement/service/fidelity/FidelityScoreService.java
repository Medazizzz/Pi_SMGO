package com.example.contentmanagement.service.fidelity;


import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FidelityScoreService {

    public double calculateScore(User user, List<Abonnement> abonnements) {

        double totalAmount = abonnements.stream()
                .mapToDouble(Abonnement::getAmount)
                .sum();

        int nb = abonnements.size();

        return totalAmount + (nb * 10);
    }
}