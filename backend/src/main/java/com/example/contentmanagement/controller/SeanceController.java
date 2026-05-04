package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.SeanceRequestDTO;
import com.example.contentmanagement.dto.SeanceResponseDTO;
import com.example.contentmanagement.service.SeanceService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/seances")
@RequiredArgsConstructor
public class SeanceController {

    private final SeanceService seanceService;

    @PostMapping
    public ResponseEntity<SeanceResponseDTO> create(@Valid @RequestBody SeanceRequestDTO request) {
        return new ResponseEntity<>(seanceService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeanceResponseDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(seanceService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<SeanceResponseDTO>> findAll() {
        return ResponseEntity.ok(seanceService.findAll());
    }

    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<List<SeanceResponseDTO>> findByCinemaId(@PathVariable String cinemaId) {
        return ResponseEntity.ok(seanceService.findByCinemaId(cinemaId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeanceResponseDTO> update(@PathVariable String id, @Valid @RequestBody SeanceRequestDTO request) {
        return ResponseEntity.ok(seanceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        seanceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
