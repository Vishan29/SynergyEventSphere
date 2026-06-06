package com.ses.ems.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Bean Validation constraint enforcing a strong password policy:
 *
 * <ul>
 *   <li>between {@link #MIN_LENGTH} and {@link #MAX_LENGTH} characters,</li>
 *   <li>at least one uppercase letter ({@code A-Z}),</li>
 *   <li>at least one lowercase letter ({@code a-z}),</li>
 *   <li>at least one digit ({@code 0-9}),</li>
 *   <li>at least one special (non-alphanumeric) character,</li>
 *   <li>no whitespace.</li>
 * </ul>
 *
 * <p>The upper bound matches BCrypt's 72-byte limit, beyond which extra
 * input is silently truncated by the hasher.</p>
 *
 * <p>{@code null} values are <em>not</em> rejected here so the constraint
 * composes cleanly with {@code @NotBlank}/{@code @NotNull}.</p>
 */
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {

    int MIN_LENGTH = 8;
    int MAX_LENGTH = 72;

    String message() default
            "Password must be 8-72 characters and include an uppercase letter, "
                    + "a lowercase letter, a digit, a special character, and no whitespace";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
