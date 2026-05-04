package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.FidelityRequestDTO;
import com.example.contentmanagement.dto.FidelityResponseDTO;

import java.util.List;

public interface FidelityService {
    FidelityResponseDTO createFidelity(FidelityRequestDTO request);
    List<FidelityResponseDTO> getAllFidelities();
    FidelityResponseDTO getFidelityById(String id);
    FidelityResponseDTO updateFidelity(String id, FidelityRequestDTO request);
    void deleteFidelity(String id);
}
