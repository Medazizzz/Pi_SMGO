package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.ReservationRequestDTO;
import com.example.contentmanagement.dto.ReservationResponseDTO;
import com.example.contentmanagement.entity.Cinema;
import com.example.contentmanagement.entity.Reservation;
import com.example.contentmanagement.entity.Salle;
import com.example.contentmanagement.entity.Seance;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CinemaRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.example.contentmanagement.repository.SalleRepository;
import com.example.contentmanagement.repository.SeanceRepository;
import com.example.contentmanagement.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final SeanceRepository seanceRepository;
    private final CinemaRepository cinemaRepository;
    private final SalleRepository salleRepository;

    @Override
    public ReservationResponseDTO create(ReservationRequestDTO request) {
        Reservation reservation = Reservation.builder()
                .seanceId(request.getSeanceId())
                .userId(request.getUserId())
                .numeroPlace(request.getNumeroPlace())
                .prix(request.getPrix())
                .contenuId(request.getContenuId())
                .watchPartyId(request.getWatchPartyId())
                .dateReservation(new Date())
                .statut("CONFIRMEE")
                .build();
        return enrich(toResponse(reservationRepository.save(reservation)), reservation.getSeanceId());
    }

    @Override
    public ReservationResponseDTO findById(String id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        return enrich(toResponse(reservation), reservation.getSeanceId());
    }

    @Override
    public List<ReservationResponseDTO> findAll() {
        return reservationRepository.findAll().stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public List<ReservationResponseDTO> findByUserId(String userId) {
        return reservationRepository.findByUserId(userId).stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public ReservationResponseDTO update(String id, ReservationRequestDTO request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        reservation.setSeanceId(request.getSeanceId());
        reservation.setUserId(request.getUserId());
        reservation.setNumeroPlace(request.getNumeroPlace());
        reservation.setPrix(request.getPrix());
        reservation.setContenuId(request.getContenuId());
        reservation.setWatchPartyId(request.getWatchPartyId());
        return enrich(toResponse(reservationRepository.save(reservation)), reservation.getSeanceId());
    }

    @Override
    public void deleteById(String id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        reservationRepository.delete(reservation);
    }

    private ReservationResponseDTO toResponse(Reservation reservation) {
        return ReservationResponseDTO.builder()
                .id(reservation.getId())
                .dateReservation(reservation.getDateReservation())
                .numeroPlace(reservation.getNumeroPlace())
                .statut(reservation.getStatut())
                .prix(reservation.getPrix())
                .userId(reservation.getUserId())
                .contenuId(reservation.getContenuId())
                .build();
    }

    private ReservationResponseDTO enrich(ReservationResponseDTO dto, String seanceId) {
        if (seanceId == null) {
            return dto;
        }

        Seance seance = seanceRepository.findById(seanceId).orElse(null);
        if (seance == null) {
            return dto;
        }

        dto.setDateSeance(seance.getDateSeance());
        dto.setHeureSeance(seance.getHeureSeance());

        if (seance.getCinemaId() != null) {
            cinemaRepository.findById(seance.getCinemaId()).map(Cinema::getNom).ifPresent(dto::setNomCinema);
        }
        if (seance.getSalle() != null) {
            salleRepository.findById(seance.getSalle()).map(Salle::getName).ifPresent(dto::setNumeroSalle);
        }
        return dto;
    }

    @Override
    public void processExpiredReservations() {
        Date now = new Date();
        long expirationTimeMillis = 24 * 60 * 60 * 1000; // 24 heures

        List<Reservation> allReservations = reservationRepository.findAll();

        for (Reservation reservation : allReservations) {
            if ("CONFIRMEE".equals(reservation.getStatut()) &&
                    reservation.getDateReservation() != null) {

                long elapsedTime = now.getTime() - reservation.getDateReservation().getTime();

                if (elapsedTime > expirationTimeMillis) {
                    reservation.setStatut("EXPIREE");
                    reservationRepository.save(reservation);
                }
            }
        }
    }
}
