package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.NewsletterCampaignDTO;
import com.example.contentmanagement.service.NewsletterCampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/newsletters")
@RequiredArgsConstructor
public class NewsletterCampaignController {

    private final NewsletterCampaignService newsletterCampaignService;

    @PostMapping
    public ResponseEntity<?> createCampaign(@Valid @RequestBody NewsletterCampaignDTO newsletterCampaignDTO) {
        try {
            NewsletterCampaignDTO result = newsletterCampaignService.createCampaign(newsletterCampaignDTO, "admin");
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error creating newsletter campaign: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating newsletter campaign: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllCampaigns() {
        try {
            List<NewsletterCampaignDTO> result = newsletterCampaignService.getAllCampaigns();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching newsletter campaigns: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error fetching newsletter campaigns: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<?> dispatchCampaign(@PathVariable String id) {
        try {
            NewsletterCampaignDTO result = newsletterCampaignService.dispatchCampaign(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error dispatching newsletter campaign {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error dispatching newsletter campaign: " + e.getMessage());
        }
    }

    @PostMapping("/dispatch-due")
    public ResponseEntity<?> dispatchDueCampaigns() {
        try {
            int dispatched = newsletterCampaignService.dispatchDueCampaigns();
            return ResponseEntity.ok("Newsletter scheduler executed. Dispatched campaigns: " + dispatched);
        } catch (Exception e) {
            log.error("Error dispatching due newsletter campaigns: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error dispatching due newsletter campaigns: " + e.getMessage());
        }
    }
}
