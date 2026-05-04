package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.CinemaRequestDTO;
import com.example.contentmanagement.dto.CinemaResponseDTO;
import com.example.contentmanagement.service.CinemaService;
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
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @PostMapping
    public ResponseEntity<CinemaResponseDTO> create(@Valid @RequestBody CinemaRequestDTO request) {
        return new ResponseEntity<>(cinemaService.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CinemaResponseDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(cinemaService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<CinemaResponseDTO>> findAll() {
        return ResponseEntity.ok(cinemaService.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CinemaResponseDTO> update(@PathVariable String id, @Valid @RequestBody CinemaRequestDTO request) {
        return ResponseEntity.ok(cinemaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        cinemaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
