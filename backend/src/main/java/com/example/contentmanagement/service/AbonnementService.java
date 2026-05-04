package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.AbonnementRequestDTO;
import com.example.contentmanagement.dto.AbonnementResponseDTO;

import java.util.List;

public interface AbonnementService {
    AbonnementResponseDTO createAbonnement(AbonnementRequestDTO request);
    List<AbonnementResponseDTO> getAllAbonnements();
    AbonnementResponseDTO getAbonnementById(String id);
    AbonnementResponseDTO updateAbonnement(String id, AbonnementRequestDTO request);
    void deleteAbonnement(String id);
}
