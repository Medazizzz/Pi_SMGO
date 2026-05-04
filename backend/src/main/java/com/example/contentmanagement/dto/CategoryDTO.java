package com.example.contentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.example.contentmanagement.validation.NoSpecialCharacters;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private String id;

    @NotBlank(message = "Category name is mandatory")
    @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
    @NoSpecialCharacters(message = "Category name cannot contain special characters")
    private String name;

    @Size(max = 500, message = "Category description must not exceed 500 characters")
    private String description;

    @Pattern(regexp = "MOVIE|SERIES|DOCUMENTARY", message = "Category type must be MOVIE, SERIES, or DOCUMENTARY")
    @Builder.Default
    private String contentType = "MOVIE";
}
