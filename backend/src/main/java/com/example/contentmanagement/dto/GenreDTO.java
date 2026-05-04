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
public class GenreDTO {
    private String id;

    @NotBlank(message = "Genre name is mandatory")
    @Size(min = 2, max = 100, message = "Genre name must be between 2 and 100 characters")
    @NoSpecialCharacters(message = "Genre name cannot contain special characters")
    private String name;

    @Size(max = 500, message = "Genre description cannot exceed 500 characters")
    private String description;

    private String color;  // Color for UI display
}
