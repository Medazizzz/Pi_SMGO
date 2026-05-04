package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.ReservationRequestDTO;
import com.example.contentmanagement.dto.ReservationResponseDTO;

import java.util.List;

public interface ReservationService {
    ReservationResponseDTO create(ReservationRequestDTO request);
    ReservationResponseDTO findById(String id);
    List<ReservationResponseDTO> findAll();
    List<ReservationResponseDTO> findByUserId(String userId);
    ReservationResponseDTO update(String id, ReservationRequestDTO request);
    void deleteById(String id);
    void processExpiredReservations();
}
