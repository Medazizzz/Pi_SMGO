package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.SalleRequestDTO;
import com.example.contentmanagement.dto.SalleResponseDTO;
import com.example.contentmanagement.entity.Salle;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.SalleRepository;
import com.example.contentmanagement.service.SalleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalleServiceImpl implements SalleService {

    private final SalleRepository salleRepository;

    @Override
    public SalleResponseDTO create(SalleRequestDTO request) {
        Salle salle = Salle.builder()
                .name(request.getName())
                .capacity(request.getCapacity())
                .build();
        return toResponse(salleRepository.save(salle));
    }

    @Override
    public SalleResponseDTO findById(String id) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle not found with id: " + id));
        return toResponse(salle);
    }

    @Override
    public List<SalleResponseDTO> findAll() {
        return salleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public SalleResponseDTO update(String id, SalleRequestDTO request) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle not found with id: " + id));
        salle.setName(request.getName());
        salle.setCapacity(request.getCapacity());
        return toResponse(salleRepository.save(salle));
    }

    @Override
    public void deleteById(String id) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle not found with id: " + id));
        salleRepository.delete(salle);
    }

    private SalleResponseDTO toResponse(Salle salle) {
        return SalleResponseDTO.builder()
                .id(salle.getId())
                .name(salle.getName())
                .capacity(salle.getCapacity())
                .build();
    }
}
