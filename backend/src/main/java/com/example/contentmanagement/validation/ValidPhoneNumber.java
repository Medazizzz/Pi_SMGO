package com.example.contentmanagement.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom validation annotation for phone number format
 * Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidPhoneNumberValidator.class)
@Documented
public @interface ValidPhoneNumber {
    String message() default "Invalid phone number format. Provide at least 7 digits";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
