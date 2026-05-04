package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.SeanceRequestDTO;
import com.example.contentmanagement.dto.SeanceResponseDTO;

import java.util.List;
import java.util.Map;

public interface SeanceService {
    SeanceResponseDTO create(SeanceRequestDTO request);
    SeanceResponseDTO findById(String id);
    List<SeanceResponseDTO> findAll();
    SeanceResponseDTO update(String id, SeanceRequestDTO request);
    void deleteById(String id);
    List<SeanceResponseDTO> findByCinemaId(String cinemaId);
    Map<String, List<SeanceResponseDTO>> findAllGroupedByCinema();
    
    // ML Prediction method
    SeanceResponseDTO predictOccupancy(SeanceRequestDTO request);
}
