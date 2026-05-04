package com.example.contentmanagement.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for ValidPhoneNumber annotation
 * Ensures phone number has proper format and at least 7 digits
 */
public class ValidPhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Null values are valid - use @NotBlank for null checking
        if (value == null || value.isBlank()) {
            return true;
        }

        // Allow digits, spaces, hyphens, parentheses, plus sign
        if (!value.matches("^[\\d\\s\\-().+]+$")) {
            return false;
        }

        // Remove non-digit characters and check if at least 7 digits
        String digitsOnly = value.replaceAll("\\D", "");
        return digitsOnly.length() >= 7 && digitsOnly.length() <= 20;
    }
}
