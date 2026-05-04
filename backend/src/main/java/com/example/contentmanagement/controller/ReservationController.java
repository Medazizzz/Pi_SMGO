package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.ReservationPaymentCheckoutRequestDTO;
import com.example.contentmanagement.dto.ReservationPaymentCheckoutResponseDTO;
import com.example.contentmanagement.dto.ReservationRequestDTO;
import com.example.contentmanagement.dto.ReservationResponseDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTemporalSnapshotDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTrainingSampleDTO;
import com.example.contentmanagement.dto.WaitlistJoinRequestDTO;
import com.example.contentmanagement.dto.WaitlistJoinResponseDTO;
import com.example.contentmanagement.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationResponseDTO> create(@Valid @RequestBody ReservationRequestDTO request) {
        return new ResponseEntity<>(reservationService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponseDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponseDTO>> findAll() {
        return ResponseEntity.ok(reservationService.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponseDTO>> findByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(reservationService.findByUserId(userId));
    }

    @GetMapping("/session/{seanceId}")
    public ResponseEntity<List<ReservationResponseDTO>> findBySeanceId(@PathVariable String seanceId) {
        return ResponseEntity.ok(reservationService.findBySeanceId(seanceId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReservationResponseDTO> update(@PathVariable String id, @Valid @RequestBody ReservationRequestDTO request) {
        return ResponseEntity.ok(reservationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        reservationService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/process-expired")
    public ResponseEntity<String> processExpiredReservations() {
        reservationService.processExpiredReservations();
        return ResponseEntity.ok("Expired reservations processed successfully");
    }

    @GetMapping("/search")
    public ResponseEntity<List<ReservationResponseDTO>> searchReservations(@RequestParam String keyword) {
        return ResponseEntity.ok(reservationService.searchReservationsByKeyword(keyword));
    }

    @PostMapping("/payment/checkout")
    public ResponseEntity<ReservationPaymentCheckoutResponseDTO> createPaymentCheckout(
            @Valid @RequestBody ReservationPaymentCheckoutRequestDTO request
    ) {
        return ResponseEntity.ok(reservationService.createPaymentCheckoutSession(request));
    }

    @PostMapping("/payment/confirm")
    public ResponseEntity<ReservationResponseDTO> confirmPaymentAndCreateReservation(@RequestParam String sessionId) {
        return ResponseEntity.ok(reservationService.confirmPaymentAndCreateReservation(sessionId));
    }

    @PostMapping("/waitlist/join")
    public ResponseEntity<WaitlistJoinResponseDTO> joinWaitlist(@Valid @RequestBody WaitlistJoinRequestDTO request) {
        return new ResponseEntity<>(reservationService.joinWaitlist(request), HttpStatus.CREATED);
    }

    @PostMapping("/ai/training-dataset/occupancy-labels/rebuild")
    public ResponseEntity<List<SeanceOccupancyTrainingSampleDTO>> rebuildFinalOccupancyTrainingDataset() {
        return ResponseEntity.ok(reservationService.rebuildFinalOccupancyTrainingDataset());
    }

    @GetMapping("/ai/training-dataset/occupancy-labels")
    public ResponseEntity<List<SeanceOccupancyTrainingSampleDTO>> findFinalOccupancyTrainingDataset() {
        return ResponseEntity.ok(reservationService.findFinalOccupancyTrainingDataset());
    }

    @PostMapping("/ai/training-dataset/temporal-snapshots/rebuild")
    public ResponseEntity<List<SeanceOccupancyTemporalSnapshotDTO>> rebuildTemporalSnapshotTrainingDataset() {
        return ResponseEntity.ok(reservationService.rebuildTemporalSnapshotTrainingDataset());
    }

    @GetMapping("/ai/training-dataset/temporal-snapshots")
    public ResponseEntity<List<SeanceOccupancyTemporalSnapshotDTO>> findTemporalSnapshotTrainingDataset() {
        return ResponseEntity.ok(reservationService.findTemporalSnapshotTrainingDataset());
    }
}
