package com.example.contentmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for ValidUsername annotation
 * Ensures username contains only alphanumeric characters, underscores, and hyphens
 */
public class ValidUsernameValidator implements ConstraintValidator<ValidUsername, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null values are valid - use @NotBlank for null checking
        if (value == null) {
            return true;
        }

        // Check if username matches pattern: alphanumeric, underscore, hyphen only
        return value.matches("^[a-zA-Z0-9_\\-]+$");
    }
}
