package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.CinemaRequestDTO;
import com.example.contentmanagement.dto.CinemaResponseDTO;
import com.example.contentmanagement.entity.Cinema;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CinemaRepository;
import com.example.contentmanagement.service.CinemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CinemaServiceImpl implements CinemaService {

    private final CinemaRepository cinemaRepository;

    @Override
    public CinemaResponseDTO create(CinemaRequestDTO request) {
        Cinema cinema = Cinema.builder()
                .nom(request.getNom())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .build();
        return toResponse(cinemaRepository.save(cinema));
    }

    @Override
    public CinemaResponseDTO findById(String id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        return toResponse(cinema);
    }

    @Override
    public List<CinemaResponseDTO> findAll() {
        return cinemaRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public CinemaResponseDTO update(String id, CinemaRequestDTO request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        cinema.setNom(request.getNom());
        cinema.setAdresse(request.getAdresse());
        cinema.setVille(request.getVille());
        return toResponse(cinemaRepository.save(cinema));
    }

    @Override
    public void deleteById(String id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        cinemaRepository.delete(cinema);
    }

    private CinemaResponseDTO toResponse(Cinema cinema) {
        return CinemaResponseDTO.builder()
                .id(cinema.getId())
                .nom(cinema.getNom())
                .adresse(cinema.getAdresse())
                .ville(cinema.getVille())
                .build();
    }
}
