package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.CinemaRequestDTO;
import com.example.contentmanagement.dto.CinemaResponseDTO;

import java.util.List;

public interface CinemaService {
    CinemaResponseDTO create(CinemaRequestDTO request);
    CinemaResponseDTO findById(String id);
    List<CinemaResponseDTO> findAll();
    CinemaResponseDTO update(String id, CinemaRequestDTO request);
    void deleteById(String id);
}
