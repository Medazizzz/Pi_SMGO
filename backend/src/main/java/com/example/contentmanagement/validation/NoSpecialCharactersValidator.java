package com.example.contentmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for NoSpecialCharacters annotation
 * Ensures field contains only alphanumeric characters, spaces, hyphens, apostrophes, commas, and periods
 * Allows names like "Lana Wachowski, Lilly Wachowski" or "Jean-Paul Sartre"
 */
public class NoSpecialCharactersValidator implements ConstraintValidator<NoSpecialCharacters, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null values are valid - use @NotBlank or @NotNull for null checking
        if (value == null) {
            return true;
        }

        // Trim the value
        value = value.trim();

        // Check if value matches the pattern: allows letters, numbers, spaces, hyphens, apostrophes, commas, and periods
        // This pattern allows names like "Lana Wachowski, Lilly Wachowski" and "Jean-Paul Sartre"
        return value.matches("^[\\p{L}\\p{N}\\s\\-',.]+$");
    }
}
