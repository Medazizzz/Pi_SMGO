package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.FidelityRequestDTO;
import com.example.contentmanagement.dto.FidelityResponseDTO;
import com.example.contentmanagement.entity.Fidelity;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.FidelityRepository;
import com.example.contentmanagement.service.FidelityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FidelityServiceImpl implements FidelityService {

    private final FidelityRepository fidelityRepository;

    @Override
    @Transactional
    public FidelityResponseDTO createFidelity(FidelityRequestDTO request) {
        Fidelity saved = fidelityRepository.save(Fidelity.builder()
                .points(request.getPoints())
                .level(request.getLevel())
                .description(request.getDescription())
                .build());
        return toResponse(saved);
    }

    @Override
    public List<FidelityResponseDTO> getAllFidelities() {
        return fidelityRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FidelityResponseDTO getFidelityById(String id) {
        Fidelity fidelity = fidelityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fidelity not found with id: " + id));
        return toResponse(fidelity);
    }

    @Override
    @Transactional
    public FidelityResponseDTO updateFidelity(String id, FidelityRequestDTO request) {
        Fidelity fidelity = fidelityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fidelity not found with id: " + id));
        fidelity.setPoints(request.getPoints());
        fidelity.setLevel(request.getLevel());
        fidelity.setDescription(request.getDescription());
        return toResponse(fidelityRepository.save(fidelity));
    }

    @Override
    @Transactional
    public void deleteFidelity(String id) {
        Fidelity fidelity = fidelityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fidelity not found with id: " + id));
        fidelityRepository.delete(fidelity);
    }

    private FidelityResponseDTO toResponse(Fidelity fidelity) {
        return FidelityResponseDTO.builder()
                .id(fidelity.getId())
                .points(fidelity.getPoints())
                .level(fidelity.getLevel() == null ? null : fidelity.getLevel().name())
                .description(fidelity.getDescription())
                .build();
    }
}
