package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.SalleRequestDTO;
import com.example.contentmanagement.dto.SalleResponseDTO;

import java.util.List;

public interface SalleService {
    SalleResponseDTO create(SalleRequestDTO request);
    SalleResponseDTO findById(String id);
    List<SalleResponseDTO> findAll();
    SalleResponseDTO update(String id, SalleRequestDTO request);
    void deleteById(String id);
}
