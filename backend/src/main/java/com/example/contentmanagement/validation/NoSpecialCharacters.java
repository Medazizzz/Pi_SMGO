package com.example.contentmanagement.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom validation annotation to prevent special characters in names
 * Allows: letters, numbers, spaces, hyphens, and apostrophes
 * Rejects: @, #, $, %, &, !, etc.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NoSpecialCharactersValidator.class)
@Documented
public @interface NoSpecialCharacters {
    String message() default "Field cannot contain special characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
