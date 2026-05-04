package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.example.contentmanagement.validation.NoSpecialCharacters;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentaryDTO extends ContentDTO {
    @NotBlank(message = "Topic is mandatory")
    @Size(min = 2, max = 100, message = "Topic must be between 2 and 100 characters")
    @NoSpecialCharacters(message = "Topic cannot contain special characters")
    private String topic;
    
    @NotBlank(message = "Narrator is mandatory")
    @Size(min = 2, max = 100, message = "Narrator name must be between 2 and 100 characters")
    @NoSpecialCharacters(message = "Narrator name cannot contain special characters")
    private String narrator;
}
