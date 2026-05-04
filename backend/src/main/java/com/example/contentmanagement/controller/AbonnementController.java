package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.AbonnementRequestDTO;
import com.example.contentmanagement.dto.AbonnementResponseDTO;
import com.example.contentmanagement.service.AbonnementService;
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
@RequestMapping("/api/abonnements")
@RequiredArgsConstructor
public class AbonnementController {

    private final AbonnementService abonnementService;

    @PostMapping
    public ResponseEntity<AbonnementResponseDTO> create(@Valid @RequestBody AbonnementRequestDTO request) {
        return new ResponseEntity<>(abonnementService.createAbonnement(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AbonnementResponseDTO>> getAll() {
        return ResponseEntity.ok(abonnementService.getAllAbonnements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AbonnementResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(abonnementService.getAbonnementById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AbonnementResponseDTO> update(
            @PathVariable String id,
            @Valid @RequestBody AbonnementRequestDTO request) {
        return ResponseEntity.ok(abonnementService.updateAbonnement(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        abonnementService.deleteAbonnement(id);
        return ResponseEntity.noContent().build();
    }
}
