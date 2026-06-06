package com.ses.ems.util;

import com.ses.ems.exception.InvalidCredentialsException;
import com.ses.ems.model.User;
import com.ses.ems.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuthenticatedUserUtil {

    public Optional<User> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails details) {
            return Optional.of(details.getUser());
        }
        return Optional.empty();
    }

    public User requireCurrentUser() {
        return currentUser().orElseThrow(InvalidCredentialsException::new);
    }

    public Optional<String> currentSessionId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof com.ses.ems.security.SessionAwareAuthenticationToken token) {
            return Optional.ofNullable(token.getSessionId());
        }
        return Optional.empty();
    }
}
