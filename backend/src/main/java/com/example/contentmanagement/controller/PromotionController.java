package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.PromotionRequestDTO;
import com.example.contentmanagement.dto.PromotionResponseDTO;
import com.example.contentmanagement.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponseDTO> create(@Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.status(201).body(promotionService.createPromotion(dto));
    }

    @GetMapping
    public ResponseEntity<List<PromotionResponseDTO>> getActive() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PromotionResponseDTO>> getAll() {
        return ResponseEntity.ok(promotionService.getAllPromotions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(promotionService.getPromotionById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<PromotionResponseDTO> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(promotionService.getPromotionByCode(code));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PromotionResponseDTO> update(@PathVariable String id, @Valid @RequestBody PromotionRequestDTO dto) {
        return ResponseEntity.ok(promotionService.updatePromotion(id, dto));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        promotionService.deactivatePromotion(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<PromotionResponseDTO>> getByClient(@PathVariable String clientId) {
        return ResponseEntity.ok(promotionService.getPromotionsByClient(clientId));
    }
}
