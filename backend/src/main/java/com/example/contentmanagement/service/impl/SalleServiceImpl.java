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

    private static final int DEFAULT_SEATS_PER_ROW = 23;

    private final SalleRepository salleRepository;

    @Override
    public SalleResponseDTO create(SalleRequestDTO request) {
        int rowCount = resolveRowCount(request);
        int seatsPerRow = resolveSeatsPerRow(request, rowCount);
        Salle salle = Salle.builder()
                .name(request.getName())
            .capacity(rowCount * seatsPerRow)
            .rowCount(rowCount)
            .seatsPerRow(seatsPerRow)
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
        int rowCount = resolveRowCount(request);
        int seatsPerRow = resolveSeatsPerRow(request, rowCount);
        salle.setName(request.getName());
        salle.setCapacity(rowCount * seatsPerRow);
        salle.setRowCount(rowCount);
        salle.setSeatsPerRow(seatsPerRow);
        return toResponse(salleRepository.save(salle));
    }

    @Override
    public void deleteById(String id) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle not found with id: " + id));
        salleRepository.delete(salle);
    }

    private SalleResponseDTO toResponse(Salle salle) {
        int rowCount = salle.getRowCount() > 0
                ? salle.getRowCount()
                : Math.max(1, (int) Math.ceil(Math.max(1, salle.getCapacity()) / (double) DEFAULT_SEATS_PER_ROW));
        int seatsPerRow = salle.getSeatsPerRow() > 0
                ? salle.getSeatsPerRow()
                : Math.max(1, (int) Math.ceil(Math.max(1, salle.getCapacity()) / (double) rowCount));

        return SalleResponseDTO.builder()
                .id(salle.getId())
                .name(salle.getName())
                .capacity(Math.max(1, salle.getCapacity()))
                .rowCount(rowCount)
                .seatsPerRow(seatsPerRow)
                .build();
    }

    private int resolveRowCount(SalleRequestDTO request) {
        if (request.getRowCount() != null && request.getRowCount() > 0) {
            return request.getRowCount();
        }
        return Math.max(1, (int) Math.ceil(Math.max(1, request.getCapacity()) / (double) DEFAULT_SEATS_PER_ROW));
    }

    private int resolveSeatsPerRow(SalleRequestDTO request, int rowCount) {
        if (request.getSeatsPerRow() != null && request.getSeatsPerRow() > 0) {
            return request.getSeatsPerRow();
        }
        return Math.max(1, (int) Math.ceil(Math.max(1, request.getCapacity()) / (double) rowCount));
    }
}
