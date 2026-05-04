package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.FidelityRequestDTO;
import com.example.contentmanagement.dto.FidelityResponseDTO;
import com.example.contentmanagement.service.FidelityService;
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
@RequestMapping("/api/fidelities")
@RequiredArgsConstructor
public class FidelityController {

    private final FidelityService fidelityService;

    @PostMapping
    public ResponseEntity<FidelityResponseDTO> create(@Valid @RequestBody FidelityRequestDTO request) {
        return new ResponseEntity<>(fidelityService.createFidelity(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FidelityResponseDTO>> getAll() {
        return ResponseEntity.ok(fidelityService.getAllFidelities());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FidelityResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(fidelityService.getFidelityById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FidelityResponseDTO> update(
            @PathVariable String id,
            @Valid @RequestBody FidelityRequestDTO request) {
        return ResponseEntity.ok(fidelityService.updateFidelity(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        fidelityService.deleteFidelity(id);
        return ResponseEntity.noContent().build();
    }
}
