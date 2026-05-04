package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.ReservationPaymentCheckoutRequestDTO;
import com.example.contentmanagement.dto.ReservationPaymentCheckoutResponseDTO;
import com.example.contentmanagement.dto.ReservationRequestDTO;
import com.example.contentmanagement.dto.ReservationResponseDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTemporalSnapshotDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTrainingSampleDTO;
import com.example.contentmanagement.dto.WaitlistJoinRequestDTO;
import com.example.contentmanagement.dto.WaitlistJoinResponseDTO;

import java.util.List;

public interface ReservationService {
    ReservationResponseDTO create(ReservationRequestDTO request);
    ReservationResponseDTO findById(String id);
    List<ReservationResponseDTO> findAll();
    List<ReservationResponseDTO> findByUserId(String userId);
    List<ReservationResponseDTO> findBySeanceId(String seanceId);
    ReservationResponseDTO update(String id, ReservationRequestDTO request);
    void deleteById(String id);
    void processExpiredReservations();
    List<ReservationResponseDTO> searchReservationsByKeyword(String keyword);
    ReservationPaymentCheckoutResponseDTO createPaymentCheckoutSession(ReservationPaymentCheckoutRequestDTO request);
    ReservationResponseDTO confirmPaymentAndCreateReservation(String sessionId);
    WaitlistJoinResponseDTO joinWaitlist(WaitlistJoinRequestDTO request);
    List<SeanceOccupancyTrainingSampleDTO> rebuildFinalOccupancyTrainingDataset();
    List<SeanceOccupancyTrainingSampleDTO> findFinalOccupancyTrainingDataset();
    List<SeanceOccupancyTemporalSnapshotDTO> rebuildTemporalSnapshotTrainingDataset();
    List<SeanceOccupancyTemporalSnapshotDTO> findTemporalSnapshotTrainingDataset();
}
