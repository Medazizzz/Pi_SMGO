package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.CommentCorrectionRequest;
import com.example.contentmanagement.dto.CommentCorrectionResponse;
import com.example.contentmanagement.service.CommentCorrectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CommentCorrectionController {

    private final CommentCorrectionService commentCorrectionService;

    @PostMapping("/correct")
    public ResponseEntity<CommentCorrectionResponse> correctComment(
            @Valid @RequestBody CommentCorrectionRequest request
    ) {
        String corrected = commentCorrectionService.correctEnglishComment(request.text());

        return ResponseEntity.ok(
                new CommentCorrectionResponse(
                        request.text(),
                        corrected
                )
        );
    }
}