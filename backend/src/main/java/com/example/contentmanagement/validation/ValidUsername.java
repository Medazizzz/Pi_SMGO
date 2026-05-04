package com.example.contentmanagement.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom validation annotation for username format
 * Ensures username contains only alphanumeric characters, underscores, and hyphens
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidUsernameValidator.class)
@Documented
public @interface ValidUsername {
    String message() default "Username can only contain letters, numbers, underscores, and hyphens (no spaces)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
