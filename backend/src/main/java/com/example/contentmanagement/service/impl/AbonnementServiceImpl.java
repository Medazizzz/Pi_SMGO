package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.AbonnementRequestDTO;
import com.example.contentmanagement.dto.AbonnementResponseDTO;
import com.example.contentmanagement.entity.Abonnement;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.AbonnementRepository;
import com.example.contentmanagement.service.AbonnementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AbonnementServiceImpl implements AbonnementService {

    private final AbonnementRepository abonnementRepository;

    @Override
    @Transactional
    public AbonnementResponseDTO createAbonnement(AbonnementRequestDTO request) {
        Abonnement saved = abonnementRepository.save(Abonnement.builder()
                .type(request.getType())
                .prix(request.getPrix())
                .description(request.getDescription())
                .build());
        return toResponse(saved);
    }

    @Override
    public List<AbonnementResponseDTO> getAllAbonnements() {
        return abonnementRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AbonnementResponseDTO getAbonnementById(String id) {
        Abonnement abonnement = abonnementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement not found with id: " + id));
        return toResponse(abonnement);
    }

    @Override
    @Transactional
    public AbonnementResponseDTO updateAbonnement(String id, AbonnementRequestDTO request) {
        Abonnement abonnement = abonnementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement not found with id: " + id));
        abonnement.setType(request.getType());
        abonnement.setPrix(request.getPrix());
        abonnement.setDescription(request.getDescription());
        return toResponse(abonnementRepository.save(abonnement));
    }

    @Override
    @Transactional
    public void deleteAbonnement(String id) {
        Abonnement abonnement = abonnementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement not found with id: " + id));
        abonnementRepository.delete(abonnement);
    }

    private AbonnementResponseDTO toResponse(Abonnement abonnement) {
        return AbonnementResponseDTO.builder()
                .id(abonnement.getId())
                .type(abonnement.getType() == null ? null : abonnement.getType().name())
                .prix(abonnement.getPrix())
                .description(abonnement.getDescription())
                .build();
    }
}
