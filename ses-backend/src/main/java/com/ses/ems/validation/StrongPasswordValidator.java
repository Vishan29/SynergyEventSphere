package com.ses.ems.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator backing {@link StrongPassword}.
 *
 * <p>Implemented with explicit single-pass character checks instead of a
 * regex with look-aheads for clarity and so we can short-circuit on the
 * first whitespace character without scanning the entire string twice.</p>
 */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Defer null/blank handling to @NotBlank so error messages don't pile up.
        if (value == null) {
            return true;
        }

        int length = value.length();
        if (length < StrongPassword.MIN_LENGTH || length > StrongPassword.MAX_LENGTH) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (int i = 0; i < length; i++) {
            char c = value.charAt(i);
            if (Character.isWhitespace(c)) {
                return false;
            }
            if (c >= 'A' && c <= 'Z') {
                hasUpper = true;
            } else if (c >= 'a' && c <= 'z') {
                hasLower = true;
            } else if (c >= '0' && c <= '9') {
                hasDigit = true;
            } else {
                // Anything printable that isn't a letter or digit counts
                // as "special" (punctuation, symbols, etc.).
                hasSpecial = true;
            }
        }

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
