package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.SeanceRequestDTO;
import com.example.contentmanagement.dto.SeanceResponseDTO;
import com.example.contentmanagement.entity.Cinema;
import com.example.contentmanagement.entity.Salle;
import com.example.contentmanagement.entity.Seance;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CinemaRepository;
import com.example.contentmanagement.repository.SalleRepository;
import com.example.contentmanagement.repository.SeanceRepository;
import com.example.contentmanagement.service.SeanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeanceServiceImpl implements SeanceService {

    private final SeanceRepository seanceRepository;
    private final CinemaRepository cinemaRepository;
    private final SalleRepository salleRepository;

    @Override
    public SeanceResponseDTO create(SeanceRequestDTO request) {
        Seance seance = Seance.builder()
                .dateSeance(request.getDateSeance())
                .heureSeance(request.getHeureSeance())
                .salle(request.getSalleId())
                .cinemaId(request.getCinemaId())
                .contenuId(request.getContenuId())
                .build();
        return enrich(toResponse(seanceRepository.save(seance)));
    }

    @Override
    public SeanceResponseDTO findById(String id) {
        Seance seance = seanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seance not found with id: " + id));
        return enrich(toResponse(seance));
    }

    @Override
    public List<SeanceResponseDTO> findAll() {
        return seanceRepository.findAll().stream()
                .map(this::toResponse)
                .map(this::enrich)
                .toList();
    }

    @Override
    public SeanceResponseDTO update(String id, SeanceRequestDTO request) {
        Seance seance = seanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seance not found with id: " + id));
        seance.setDateSeance(request.getDateSeance());
        seance.setHeureSeance(request.getHeureSeance());
        seance.setSalle(request.getSalleId());
        seance.setCinemaId(request.getCinemaId());
        seance.setContenuId(request.getContenuId());
        return enrich(toResponse(seanceRepository.save(seance)));
    }

    @Override
    public void deleteById(String id) {
        Seance seance = seanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seance not found with id: " + id));
        seanceRepository.delete(seance);
    }

    @Override
    public List<SeanceResponseDTO> findByCinemaId(String cinemaId) {
        return seanceRepository.findByCinemaId(cinemaId).stream()
                .map(this::toResponse)
                .map(this::enrich)
                .toList();
    }

    private SeanceResponseDTO toResponse(Seance seance) {
        return SeanceResponseDTO.builder()
                .id(seance.getId())
                .dateSeance(seance.getDateSeance())
                .heureSeance(seance.getHeureSeance())
                .contenuId(seance.getContenuId())
                .numeroSalle(seance.getSalle())
                .nomCinema(seance.getCinemaId())
                .build();
    }

    private SeanceResponseDTO enrich(SeanceResponseDTO dto) {
        if (dto.getNomCinema() != null) {
            cinemaRepository.findById(dto.getNomCinema()).map(Cinema::getNom).ifPresent(dto::setNomCinema);
        }
        if (dto.getNumeroSalle() != null) {
            salleRepository.findById(dto.getNumeroSalle()).map(Salle::getName).ifPresent(dto::setNumeroSalle);
        }
        return dto;
    }
}
